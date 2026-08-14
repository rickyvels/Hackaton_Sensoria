from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import running_on_vercel
from ..database import SessionLocal, get_session
from ..dependencies import require_role
from ..models import BarrierReport, CaseEvent, CaseRecord, OrchestrationRun, User
from ..orchestration import orchestration_manager
from ..schemas import (
    OrchestrationRunRead,
    ProvenanceEdgeRead,
    ProvenanceGraphResponse,
    ProvenanceNodeRead,
    RunControlCreate,
)

router = APIRouter(prefix="/orchestration", tags=["orchestration"])


async def _professional_case(session: AsyncSession, case_id: int, user: User) -> CaseRecord:
    current_case = await session.scalar(
        select(CaseRecord).where(CaseRecord.id == case_id, CaseRecord.professional_user_id == user.id)
    )
    if current_case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return current_case


async def _professional_run(session: AsyncSession, run_id: str, user: User) -> OrchestrationRun:
    run = await session.scalar(
        select(OrchestrationRun)
        .join(CaseRecord, OrchestrationRun.case_id == CaseRecord.id)
        .where(OrchestrationRun.id == run_id, CaseRecord.professional_user_id == user.id)
    )
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run


@router.post("/cases/{case_id}/runs", response_model=OrchestrationRunRead, status_code=202)
async def start_run(
    case_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> OrchestrationRun:
    current_case = await _professional_case(session, case_id, user)
    if not current_case.barrier_reported:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The case has no reported barrier")
    from ..services import fetch_latest_barrier_report
    report = await fetch_latest_barrier_report(session, case_id=case_id)
    if report is None or not report.validated_by_professional:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La información debe ser validada por un profesional antes de activar agentes")
    if current_case.approval_status in {"approved", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The current barrier already has a recorded professional decision",
        )
    return await orchestration_manager.create_run(case_id)


@router.get("/cases/{case_id}/runs/current", response_model=OrchestrationRunRead | None)
async def current_run(
    case_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> OrchestrationRun | None:
    await _professional_case(session, case_id, user)
    latest_report = await session.scalar(
        select(BarrierReport).where(BarrierReport.case_id == case_id).order_by(desc(BarrierReport.id))
    )
    if latest_report is not None and not latest_report.validated_by_professional:
        return None
    latest_run = await session.scalar(
        select(OrchestrationRun)
        .where(OrchestrationRun.case_id == case_id)
        .order_by(desc(OrchestrationRun.created_at), desc(OrchestrationRun.id))
    )
    latest_barrier_event = await session.scalar(
        select(CaseEvent)
        .where(CaseEvent.case_id == case_id, CaseEvent.kind == "Barrier")
        .order_by(desc(CaseEvent.id))
    )
    if latest_run is None or latest_barrier_event is None:
        return None
    if latest_run.status in {"queued", "running", "paused", "waiting_approval"}:
        return latest_run
    later_events = list(
        (
            await session.execute(
                select(CaseEvent).where(
                    CaseEvent.case_id == case_id,
                    CaseEvent.id > latest_barrier_event.id,
                )
            )
        ).scalars()
    )
    return latest_run if any((event.event_metadata or {}).get("run_id") == latest_run.id for event in later_events) else None


@router.get("/runs/{run_id}", response_model=OrchestrationRunRead)
async def get_run(
    run_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> OrchestrationRun:
    return await _professional_run(session, run_id, user)


@router.post("/runs/{run_id}/control", response_model=OrchestrationRunRead)
async def control_run(
    run_id: str,
    payload: RunControlCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> OrchestrationRun:
    await _professional_run(session, run_id, user)
    run = await orchestration_manager.control(run_id, payload.action)
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run


@router.get("/runs/{run_id}/events")
async def stream_run_events(
    run_id: str,
    after_id: int = Query(default=0, ge=0),
    follow: bool = True,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> StreamingResponse:
    run = await _professional_run(session, run_id, user)
    case_id = run.case_id
    # Sin worker de fondo, esta invocación es la única que puede hacer avanzar la corrida.
    # `running` aquí significa que una invocación anterior se congeló a medias: `_execute`
    # se salta los agentes ya completados, así que retomarla es la recuperación.
    drive_inline = running_on_vercel() and run.status in {"queued", "running"}

    async def event_stream():
        queue = orchestration_manager.broker.subscribe(run_id)
        execution: asyncio.Task[None] | None = None
        seen: set[int] = set()
        try:
            async with SessionLocal() as stream_session:
                events = list(
                    (
                        await stream_session.execute(
                            select(CaseEvent)
                            .where(CaseEvent.case_id == case_id, CaseEvent.id > after_id)
                            .order_by(CaseEvent.id)
                        )
                    ).scalars()
                )
            for event in events:
                if (event.event_metadata or {}).get("run_id") != run_id:
                    continue
                seen.add(event.id)
                payload = orchestration_manager.event_payload(event)
                yield _sse(event.kind, payload)
                if _is_terminal_event(payload):
                    return
            if not follow:
                return
            if drive_inline:
                # La suscripción ya está activa, así que ningún evento de la corrida se pierde
                # entre el arranque y el primer `queue.get()`.
                execution = asyncio.create_task(orchestration_manager.execute_inline(run_id))
            while True:
                try:
                    payload = await asyncio.wait_for(
                        queue.get(), timeout=2 if execution is not None else 15
                    )
                except TimeoutError:
                    if execution is not None and execution.done() and queue.empty():
                        return
                    yield "event: ping\ndata: {}\n\n"
                    continue
                if payload["id"] in seen:
                    continue
                seen.add(payload["id"])
                yield _sse(payload["kind"], payload)
                if _is_terminal_event(payload):
                    return
        finally:
            if execution is not None:
                # No hace falta esperarla: el orquestador confirma la transacción antes de
                # publicar cada evento, así que al recibir el terminal el estado ya es durable.
                # Si en cambio se llega aquí porque el cliente cortó, cancelar deja la corrida
                # en `running` y la siguiente apertura del stream la retoma.
                execution.cancel()
            orchestration_manager.broker.unsubscribe(run_id, queue)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store, private", "X-Accel-Buffering": "no"},
    )


def _sse(kind: str, payload: dict) -> str:
    event_name = "".join((f"_{char.lower()}" if char.isupper() else char) for char in kind).lstrip("_")
    return f"event: {event_name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _is_terminal_event(payload: dict) -> bool:
    metadata = payload.get("metadata") or {}
    return payload.get("kind") in {"ApprovalRequest", "AggregateMetric"} or metadata.get("run_status") == "failed"


@router.get("/cases/{case_id}/graph", response_model=ProvenanceGraphResponse)
async def case_graph(
    case_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> ProvenanceGraphResponse:
    current_case = await _professional_case(session, case_id, user)
    events = list(
        (
            await session.execute(select(CaseEvent).where(CaseEvent.case_id == case_id).order_by(CaseEvent.id))
        ).scalars()
    )
    runs = list(
        (
            await session.execute(
                select(OrchestrationRun)
                .where(OrchestrationRun.case_id == case_id)
                .order_by(OrchestrationRun.created_at, OrchestrationRun.id)
            )
        ).scalars()
    )
    nodes = [
        ProvenanceNodeRead(
            id=f"case-{case_id}",
            kind="Case",
            label=current_case.case_code,
            actor="Sistema",
            timestamp=current_case.created_at,
            origin="neuroalianza-api",
            sensitivity="synthetic",
            explanation="Caso sintético que agrupa la traza causal.",
            status=current_case.route_status,
        )
    ]
    edges: list[ProvenanceEdgeRead] = []
    existing_ids = {event.id for event in events}
    events_by_run: dict[str, list[CaseEvent]] = {}
    for event in events:
        event_run_id = str((event.event_metadata or {}).get("run_id") or "")
        if event_run_id:
            events_by_run.setdefault(event_run_id, []).append(event)

    barrier_events = [event for event in events if event.kind == "Barrier"]
    for run in runs:
        run_events = events_by_run.get(run.id, [])
        completed_agents = {
            str((event.event_metadata or {}).get("agent_id"))
            for event in run_events
            if event.kind == "AgentProposal" and (event.event_metadata or {}).get("agent_id")
        }
        active_duration_ms = sum(
            int((event.event_metadata or {}).get("duration_ms") or 0)
            for event in run_events
            if event.kind == "AgentExecution" and (event.event_metadata or {}).get("phase") == "completed"
        )
        fallback_count = sum(
            1 for event in run_events if (event.event_metadata or {}).get("status") == "fallback"
        )
        decision_events = [event for event in run_events if event.kind == "ApprovalDecision"]
        gate_status = (
            "waiting_approval"
            if run.status == "waiting_approval"
            else str((decision_events[-1].event_metadata or {}).get("status", "not_requested"))
            if decision_events
            else "not_requested"
        )
        first_timestamp = run_events[0].created_at if run_events else run.created_at
        last_timestamp = run_events[-1].created_at if run_events else run.updated_at
        elapsed_ms = max(0, round((last_timestamp - first_timestamp).total_seconds() * 1000))
        run_node_id = f"run-{run.id}"
        nodes.append(
            ProvenanceNodeRead(
                id=run_node_id,
                kind="OrchestrationRun",
                label=f"Corrida {run.id[:8]}",
                actor="Orquestador",
                timestamp=run.created_at,
                origin="neuroalianza-api",
                sensitivity="synthetic",
                explanation="Corrida persistente que correlaciona agentes, políticas, autorización y efectos.",
                status=run.status,
                metadata={
                    "run_id": run.id,
                    "trace_id": run.id,
                    "event_schema": "neuroalianza.trace.v1",
                    "provider": run.provider,
                    "model": run.model,
                    "barrier_report_id": run.barrier_report_id,
                    "event_count": len(run_events),
                    "agent_count": len(completed_agents),
                    "fallback_count": fallback_count,
                    "active_duration_ms": active_duration_ms,
                    "elapsed_ms": elapsed_ms,
                    "gate_status": gate_status,
                },
            )
        )
        matching_barriers = []
        inferred_barrier = False
        if run.barrier_report_id is not None:
            matching_barriers = [
                event
                for event in barrier_events
                if (event.event_metadata or {}).get("barrier_report_id") == run.barrier_report_id
            ]
        if not matching_barriers:
            matching_barriers = [event for event in barrier_events if event.created_at <= run.created_at]
            inferred_barrier = bool(matching_barriers)
        source = f"event-{matching_barriers[-1].id}" if matching_barriers else f"case-{case_id}"
        edges.append(
            ProvenanceEdgeRead(
                id=f"edge-{source}-{run_node_id}",
                source=source,
                target=run_node_id,
                relation="inferred_triggered_run" if inferred_barrier else "triggered_run",
                explanation=(
                    "Relación inferida para una corrida histórica a partir de la última barrera anterior."
                    if inferred_barrier
                    else "La barrera identificada originó una corrida observable y persistente."
                ),
            )
        )

    run_sequences: dict[str, int] = {}
    last_run_event: dict[str, str] = {}
    for global_sequence, event in enumerate(events, start=1):
        metadata = dict(event.event_metadata or {})
        event_run_id = str(metadata.get("run_id") or "")
        if event_run_id:
            run_sequences[event_run_id] = run_sequences.get(event_run_id, 0) + 1
            metadata.setdefault("trace_id", event_run_id)
            metadata["sequence"] = run_sequences[event_run_id]
        else:
            metadata["sequence"] = global_sequence
        metadata["event_id"] = event.id
        node_id = f"event-{event.id}"
        nodes.append(
            ProvenanceNodeRead(
                id=node_id,
                kind=event.kind,
                label=event.kind,
                actor=event.actor,
                timestamp=event.created_at,
                origin=str(metadata.get("origin", "neuroalianza-api")),
                sensitivity=str(metadata.get("sensitivity", "synthetic")),
                explanation=str(metadata.get("explanation", event.message)),
                status=str(metadata["status"]) if metadata.get("status") is not None else None,
                metadata=metadata,
            )
        )
        previous_id = metadata.get("previous_event_id")
        if event_run_id:
            source = last_run_event.get(event_run_id, f"run-{event_run_id}")
            last_run_event[event_run_id] = node_id
        else:
            source = f"event-{previous_id}" if previous_id in existing_ids else f"case-{case_id}"
        relation = str(metadata.get("relation", "triggered"))
        edges.append(
            ProvenanceEdgeRead(
                id=f"edge-{source}-{node_id}",
                source=source,
                target=node_id,
                relation=relation,
                explanation=f"{event.kind} {relation} desde el evento causal anterior.",
            )
        )
    return ProvenanceGraphResponse(nodes=nodes, edges=edges)
