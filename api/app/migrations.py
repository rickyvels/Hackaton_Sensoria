from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def ensure_orchestration_schema(connection: AsyncConnection) -> None:
    """Apply the small additive migration needed by existing demo databases."""
    if connection.dialect.name != "sqlite":
        return

    run_columns = {
        row[1]
        for row in (await connection.execute(text("PRAGMA table_info('orchestration_runs')"))).all()
    }
    if "barrier_report_id" not in run_columns:
        await connection.execute(
            text(
                "ALTER TABLE orchestration_runs ADD COLUMN barrier_report_id "
                "INTEGER REFERENCES barrier_reports(id)"
            )
        )

    decision_columns = {
        row[1]
        for row in (await connection.execute(text("PRAGMA table_info('approval_decisions')"))).all()
    }
    if "orchestration_run_id" not in decision_columns:
        await connection.execute(
            text(
                "ALTER TABLE approval_decisions ADD COLUMN orchestration_run_id "
                "VARCHAR(36) REFERENCES orchestration_runs(id)"
            )
        )
    if "proposal_hash" not in decision_columns:
        await connection.execute(text("ALTER TABLE approval_decisions ADD COLUMN proposal_hash VARCHAR(64)"))

    report_columns = {row[1] for row in (await connection.execute(text("PRAGMA table_info('barrier_reports')"))).all()}
    additions = {
        "ai_synthesis": "JSON",
        "validation_status": "VARCHAR(32) NOT NULL DEFAULT 'pending_validation'",
        "validated_by_professional": "BOOLEAN NOT NULL DEFAULT 0",
        "reviewer_user_id": "INTEGER REFERENCES users(id)",
        "reviewer_comment": "TEXT",
        "validated_at": "DATETIME",
    }
    for name, definition in additions.items():
        if name not in report_columns:
            await connection.execute(text(f"ALTER TABLE barrier_reports ADD COLUMN {name} {definition}"))

    await connection.execute(
        text("CREATE INDEX IF NOT EXISTS ix_orchestration_runs_barrier_report_id ON orchestration_runs (barrier_report_id)")
    )
    await connection.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_active_run_per_barrier "
            "ON orchestration_runs (barrier_report_id) "
            "WHERE status IN ('queued', 'running', 'paused', 'waiting_approval')"
        )
    )
    await connection.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_approval_decisions_barrier_report_id "
            "ON approval_decisions (barrier_report_id)"
        )
    )
    await connection.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_approval_decisions_orchestration_run_id "
            "ON approval_decisions (orchestration_run_id)"
        )
    )
