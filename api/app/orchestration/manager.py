from __future__ import annotations

import asyncio
from collections import defaultdict
from contextlib import suppress
from datetime import UTC, datetime
from time import perf_counter
from typing import Any
from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError

from ..config import get_settings
from ..database import SessionLocal
from ..models import BarrierReport, CaseEvent, CaseRecord, OrchestrationRun
from ..services import emit_event, fetch_latest_barrier_report
from .providers import AgentId, DeterministicProvider, build_provider

INITIAL_AGENTS: tuple[AgentId, ...] = ("navigator", "coordinator", "followup")


class RunEventBroker:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[dict[str, Any]]]] = defaultdict(set)

    def subscribe(self, run_id: str) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=128)
        self._subscribers[run_id].add(queue)
        return queue

    def unsubscribe(self, run_id: str, queue: asyncio.Queue[dict[str, Any]]) -> None:
        self._subscribers[run_id].discard(queue)
        if not self._subscribers[run_id]:
            self._subscribers.pop(run_id, None)

    def publish(self, run_id: str, payload: dict[str, Any]) -> None:
        for queue in tuple(self._subscribers.get(run_id, ())):
            if queue.full():
                queue.get_nowait()
            queue.put_nowait(payload)


class OrchestrationManager:
    def __init__(self) -> None:
        self.broker = RunEventBroker()
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._worker: asyncio.Task[None] | None = None
        self._paused: set[str] = set()
        self._creation_locks: dict[int, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def start(self) -> None:
        if self._worker is None or self._worker.done():
            self._worker = asyncio.create_task(self._run_worker())

    async def stop(self) -> None:
        if self._worker is not None:
            self._worker.cancel()
            with suppress(asyncio.CancelledError):
                await self._worker
        self._worker = None

    async def reset(self) -> None:
        await self.stop()
        self._queue = asyncio.Queue()
        self._paused.clear()
        self._creation_locks.clear()
        self.broker = RunEventBroker()

    async def enqueue(self, run_id: str) -> None:
        await self.start()
        await self._queue.put(run_id)

    async def recover(self) -> None:
        """Reclaim durable work after an API restart."""
        recoverable_ids: list[str] = []
        async with SessionLocal() as session:
            runs = list(
                (
                    await session.execute(
                        select(OrchestrationRun).where(
                            OrchestrationRun.status.in_(("queued", "running", "waiting_approval"))
                        )
                    )
                ).scalars()
            )
            for run in runs:
                case = await session.get(CaseRecord, run.case_id)
                has_approval_request = False
                if run.status == "waiting_approval":
                    events = list(
                        (
                            await session.execute(
                                select(CaseEvent).where(
                                    CaseEvent.case_id == run.case_id,
                                    CaseEvent.kind == "ApprovalRequest",
                                )
                            )
                        ).scalars()
                    )
                    has_approval_request = any(
                        (event.event_metadata or {}).get("run_id") == run.id for event in events
                    )
                if run.status in {"queued", "running"} or (
                    run.status == "waiting_approval"
                    and case is not None
                    and (
                        case.approval_status in {"approved", "rejected"}
                        or not has_approval_request
                    )
                ):
                    run.status = "queued"
                    recoverable_ids.append(run.id)
            await session.commit()
        for run_id in recoverable_ids:
            await self.enqueue(run_id)

    async def create_run(self, case_id: int) -> OrchestrationRun:
        async with self._creation_locks[case_id]:
            settings = get_settings()
            provider = build_provider(settings)
            async with SessionLocal() as session:
                report = await session.scalar(
                    select(BarrierReport)
                    .where(BarrierReport.case_id == case_id, BarrierReport.status == "pending_review")
                    .order_by(desc(BarrierReport.created_at), desc(BarrierReport.id))
                )
                if report is None or not report.validated_by_professional:
                    raise ValueError("The latest information requires professional validation before agents can run")
                active = await session.scalar(
                    select(OrchestrationRun)
                    .where(
                        OrchestrationRun.barrier_report_id == report.id,
                        OrchestrationRun.status.in_(("queued", "running", "paused", "waiting_approval")),
                    )
                    .order_by(desc(OrchestrationRun.created_at))
                )
                if active is not None:
                    return active
                run = OrchestrationRun(
                    id=str(uuid4()),
                    case_id=case_id,
                    barrier_report_id=report.id,
                    status="queued",
                    provider=provider.name,
                    model=provider.model,
                    artifacts=[],
                )
                session.add(run)
                try:
                    await session.commit()
                except IntegrityError:
                    await session.rollback()
                    existing = await session.scalar(
                        select(OrchestrationRun).where(
                            OrchestrationRun.barrier_report_id == report.id,
                            OrchestrationRun.status.in_(("queued", "running", "paused", "waiting_approval")),
                        )
                    )
                    if existing is None:
                        raise
                    return existing
                await session.refresh(run)
            await self.enqueue(run.id)
            return run

    async def control(self, run_id: str, action: str) -> OrchestrationRun | None:
        async with SessionLocal() as session:
            run = await session.get(OrchestrationRun, run_id)
            if run is None:
                return None
            if action == "pause" and run.status in {"queued", "running"}:
                self._paused.add(run_id)
                run.status = "paused"
                await session.commit()
            elif action == "resume" and run.status == "paused":
                self._paused.discard(run_id)
                run.status = "queued"
                await session.commit()
                await self.enqueue(run_id)
            await session.refresh(run)
            return run

    async def resume_after_decision(self, run_id: str) -> None:
        async with SessionLocal() as session:
            run = await session.get(OrchestrationRun, run_id)
            if run is None or run.status != "waiting_approval":
                return
            run.status = "queued"
            await session.commit()
        await self.enqueue(run_id)

    async def _run_worker(self) -> None:
        while True:
            run_id = await self._queue.get()
            try:
                if run_id not in self._paused:
                    await self._execute(run_id)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                await self._mark_failed(run_id, exc)
            finally:
                self._queue.task_done()

    async def _execute(self, run_id: str) -> None:
        settings = get_settings()
        provider = build_provider(settings)
        fallback = DeterministicProvider()
        async with SessionLocal() as session:
            run = await session.get(OrchestrationRun, run_id)
            if run is None or run.status in {"completed", "failed", "waiting_approval"}:
                return
            case = await session.get(CaseRecord, run.case_id)
            report = (
                await session.get(BarrierReport, run.barrier_report_id)
                if run.barrier_report_id is not None
                else await fetch_latest_barrier_report(session, case_id=run.case_id)
            )
            if case is None or report is None:
                raise RuntimeError("La corrida no tiene un caso y una barrera válidos")
            run.status = "running"
            run.provider = provider.name
            run.model = provider.model
            await session.commit()

            completed_ids = {item["agent_id"] for item in (run.artifacts or [])}
            if "followup" in completed_ids and case.approval_status in {"approved", "rejected"}:
                if "quality" not in completed_ids:
                    await self._run_agent(session, run, case, report, "quality", provider, fallback)
                if run_id in self._paused:
                    run.status = "paused"
                    await session.commit()
                    return
                await self._finish_run(session, run, case)
                return

            for agent_id in INITIAL_AGENTS:
                if agent_id in completed_ids:
                    continue
                if run_id in self._paused:
                    run.status = "paused"
                    await session.commit()
                    return
                await self._run_agent(session, run, case, report, agent_id, provider, fallback)

            if run_id in self._paused:
                run.status = "paused"
                await session.commit()
                return

            await self._enter_approval_gate(session, run, case)

    async def _enter_approval_gate(
        self,
        session,
        run: OrchestrationRun,
        case: CaseRecord,
    ) -> None:
        """Persist the complete human gate atomically and repair partial legacy gates."""
        run.status = "waiting_approval"
        run.current_agent = "followup"
        case.route_status = "awaiting_authorization"
        case.approval_status = "pending"

        existing_events = list(
            (
                await session.execute(
                    select(CaseEvent).where(
                        CaseEvent.case_id == run.case_id,
                        CaseEvent.kind.in_(("PolicyCheck", "ApprovalRequest")),
                    )
                )
            ).scalars()
        )
        existing_kinds = {
            event.kind
            for event in existing_events
            if (event.event_metadata or {}).get("run_id") == run.id
        }
        specifications = (
            (
                "PolicyCheck",
                "La política bloqueó cualquier cambio de ruta hasta recibir una decisión profesional.",
                "validated_by",
                "blocked",
            ),
            (
                "ApprovalRequest",
                "Solicitud de autorización enviada al profesional responsable.",
                "requires_approval",
                "waiting_approval",
            ),
        )
        created: list[CaseEvent] = []
        for kind, message, relation, status in specifications:
            if kind in existing_kinds:
                continue
            created.append(
                await emit_event(
                    session,
                    case_id=run.case_id,
                    kind=kind,
                    actor="Orquestador",
                    message=message,
                    metadata={
                        "run_id": run.id,
                        "trace_id": run.id,
                        "event_schema": "neuroalianza.trace.v1",
                        "run_status": run.status,
                        "relation": relation,
                        "status": status,
                        "provider": run.provider,
                        "model": run.model,
                    },
                )
            )
        await session.commit()
        for event in created:
            await session.refresh(event)
            self.broker.publish(run.id, self.event_payload(event))

    async def _run_agent(
        self,
        session,
        run: OrchestrationRun,
        case: CaseRecord,
        report: BarrierReport,
        agent_id: AgentId,
        provider,
        fallback: DeterministicProvider,
    ) -> None:
        started_at = datetime.now(UTC)
        started_clock = perf_counter()
        span_id = uuid4().hex[:16]
        run.current_agent = agent_id
        await self._emit(
            session,
            run,
            "AgentExecution",
            agent_id,
            f"{agent_id} inició una revisión operacional con datos autorizados.",
            relation="executed_by",
            status="working",
            agent_id=agent_id,
            span_id=span_id,
            phase="started",
            started_at=started_at.isoformat(),
            tool="ollama.chat" if provider.name == "ollama" else "deterministic.rules",
            input_fields=[
                "route_status",
                "barrier_type",
                "barrier_title",
                "barrier_description",
                "availability_note",
                "previous_artifacts",
            ],
        )
        context = {
            "route_status": case.route_status,
            "barrier_type": report.barrier_type,
            "barrier_title": report.title,
            "barrier_description": report.description,
            "availability_note": report.availability_note,
            "previous_artifacts": run.artifacts or [],
        }
        used_fallback = False
        try:
            artifact = await provider.propose(agent_id, context)
        except Exception as exc:
            if not get_settings().agent_fallback_enabled:
                raise
            artifact = await fallback.propose(agent_id, context)
            used_fallback = True
            await self._emit(
                session,
                run,
                "AgentExecution",
                "Orquestador",
                f"El proveedor {provider.name} falló de forma segura; se aplicó la regla determinista.",
                relation="fallback_to",
                status="fallback",
                agent_id=agent_id,
                span_id=span_id,
                phase="fallback",
                error_type=type(exc).__name__,
                requested_provider=provider.name,
                requested_model=provider.model,
                provider=fallback.name,
                model=fallback.model,
            )
        # La política del orquestador es la autoridad sobre efectos sensibles;
        # el modelo puede proponer, pero no redefinir qué requiere aprobación.
        artifact = artifact.model_copy(
            update={"requires_approval": agent_id in {"coordinator", "followup"}}
        )
        artifacts = list(run.artifacts or [])
        artifact_payload = artifact.model_dump()
        artifact_payload["provider"] = fallback.name if used_fallback else provider.name
        artifact_payload["model"] = fallback.model if used_fallback else provider.model
        finished_at = datetime.now(UTC)
        duration_ms = max(0, round((perf_counter() - started_clock) * 1000))
        artifact_payload["span_id"] = span_id
        artifact_payload["duration_ms"] = duration_ms
        artifacts.append(artifact_payload)
        run.artifacts = artifacts
        if agent_id == "followup":
            run.proposal = artifact.decision
        await self._emit(
            session,
            run,
            "AgentProposal",
            agent_id,
            artifact.decision,
            relation="proposed",
            status="completed",
            agent_id=agent_id,
            span_id=span_id,
            phase="output",
            started_at=started_at.isoformat(),
            finished_at=finished_at.isoformat(),
            duration_ms=duration_ms,
            artifact=artifact_payload,
            provider=artifact_payload["provider"],
            model=artifact_payload["model"],
        )
        await self._emit(
            session,
            run,
            "AgentExecution",
            agent_id,
            f"{agent_id} completó su artefacto estructurado.",
            relation="completed",
            status="completed",
            agent_id=agent_id,
            span_id=span_id,
            phase="completed",
            started_at=started_at.isoformat(),
            finished_at=finished_at.isoformat(),
            duration_ms=duration_ms,
            tool="ollama.chat" if artifact_payload["provider"] == "ollama" else "deterministic.rules",
            provider=artifact_payload["provider"],
            model=artifact_payload["model"],
        )

    async def _finish_run(self, session, run: OrchestrationRun, case: CaseRecord) -> None:
        run.current_agent = "quality"
        run_events = list(
            (
                await session.execute(select(CaseEvent).where(CaseEvent.case_id == run.case_id))
            ).scalars()
        )
        emitted_kinds = {
            event.kind
            for event in run_events
            if (event.event_metadata or {}).get("run_id") == run.id
        }
        if "Notification" not in emitted_kinds:
            await self._emit(
                session,
                run,
                "Notification",
                "Orquestador",
                "La orientación familiar fue actualizada después de la decisión profesional.",
                relation="updates",
                status="completed",
            )
        if "RouteState" not in emitted_kinds:
            await self._emit(
                session,
                run,
                "RouteState",
                "Orquestador",
                f"La ruta quedó en estado {case.route_status}.",
                relation="updates",
                status=case.route_status,
            )
        if "AggregateMetric" not in emitted_kinds:
            run.status = "completed"
            await self._emit(
                session,
                run,
                "AggregateMetric",
                "Inteligencia y Calidad",
                "Se agregó una señal anónima de barrera al indicador de continuidad.",
                relation="contributes_to",
                status="completed",
            )
        elif run.status != "completed":
            run.status = "completed"
            await session.commit()

    async def _emit(
        self,
        session,
        run: OrchestrationRun,
        kind: str,
        actor: str,
        message: str,
        *,
        relation: str,
        status: str,
        **metadata: Any,
    ) -> CaseEvent:
        event = await emit_event(
            session,
            case_id=run.case_id,
            kind=kind,
            actor=actor,
            message=message,
            metadata={
                "run_id": run.id,
                "trace_id": run.id,
                "event_schema": "neuroalianza.trace.v1",
                "run_status": run.status,
                "relation": relation,
                "status": status,
                "provider": run.provider,
                "model": run.model,
                **metadata,
            },
        )
        await session.commit()
        await session.refresh(event)
        self.broker.publish(run.id, self.event_payload(event))
        return event

    async def _mark_failed(self, run_id: str, exc: Exception) -> None:
        async with SessionLocal() as session:
            run = await session.get(OrchestrationRun, run_id)
            if run is None:
                return
            run.status = "failed"
            run.error = "La ejecución se detuvo de forma segura."
            await self._emit(
                session,
                run,
                "AgentExecution",
                "Orquestador",
                "La corrida falló de forma segura y no produjo efectos sensibles.",
                relation="failed",
                status="failed",
                error_type=type(exc).__name__,
            )

    @staticmethod
    def event_payload(event: CaseEvent) -> dict[str, Any]:
        return {
            "id": event.id,
            "kind": event.kind,
            "actor": event.actor,
            "message": event.message,
            "metadata": event.event_metadata or {},
            "created_at": event.created_at.isoformat(),
        }


orchestration_manager = OrchestrationManager()
