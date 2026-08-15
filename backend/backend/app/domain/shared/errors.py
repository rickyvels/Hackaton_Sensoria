"""Domain exceptions and error definitions."""

from __future__ import annotations

from typing import Any


class DomainError(Exception):
    """Base domain exception."""

    def __init__(
        self,
        message: str,
        *,
        error_type: str = "domain_error",
        details: dict[str, Any] | None = None,
    ) -> None:
        """Initializes domain error with message and metadata.

        Args:
            message: Human readable error explanation.
            error_type: Machine readable error classification.
            details: Optional contextual key-value details.
        """
        super().__init__(message)
        self.message = message
        self.error_type = error_type
        self.details = details or {}


class EntityNotFoundError(DomainError):
    """Raised when an entity is not found by identifier."""

    def __init__(self, entity_name: str, entity_id: str) -> None:
        """Initializes entity not found error."""
        super().__init__(
            message=f"{entity_name} with id '{entity_id}' was not found.",
            error_type="not_found",
            details={"entity_name": entity_name, "entity_id": entity_id},
        )


class InvalidTransitionError(DomainError):
    """Raised when a state machine transition is not allowed."""

    def __init__(self, current_state: str, target_state: str, reason: str = "") -> None:
        """Initializes invalid transition error."""
        msg = f"Cannot transition from '{current_state}' to '{target_state}'."
        if reason:
            msg += f" Reason: {reason}"
        super().__init__(
            message=msg,
            error_type="invalid_transition",
            details={
                "current_state": current_state,
                "target_state": target_state,
                "reason": reason,
            },
        )


class BusinessRuleViolationError(DomainError):
    """Raised when a business rule or invariant is violated."""

    def __init__(self, rule_name: str, message: str, details: dict[str, Any] | None = None) -> None:
        """Initializes rule violation error."""
        combined_details = {"rule_name": rule_name}
        if details:
            combined_details.update(details)
        super().__init__(
            message=message,
            error_type="business_rule_violation",
            details=combined_details,
        )


class InvalidCatalogError(DomainError):
    """Raised when a screening catalog or age range is invalid."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        """Initializes invalid catalog error."""
        super().__init__(
            message=message,
            error_type="invalid_catalog",
            details=details,
        )


class ActiveCaseConflictError(DomainError):
    """Raised when trying to create an active case for a patient with an existing active case."""

    def __init__(self, patient_id: str, active_case_id: str) -> None:
        """Initializes active case conflict error."""
        super().__init__(
            message=f"Patient '{patient_id}' already has an active case '{active_case_id}'.",
            error_type="active_case_conflict",
            details={"patient_id": patient_id, "active_case_id": active_case_id},
        )
