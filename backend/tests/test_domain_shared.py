"""Tests for shared domain types, errors, and result patterns."""

from __future__ import annotations

import pytest

from app.domain.shared.errors import (
    ActiveCaseConflictError,
    BusinessRuleViolationError,
    DomainError,
    EntityNotFoundError,
    InvalidCatalogError,
    InvalidTransitionError,
)
from app.domain.shared.ids import (
    new_actividad_id,
    new_caso_id,
    new_cita_id,
    new_cuidador_id,
    new_evento_id,
    new_nota_clinica_id,
    new_paciente_id,
    new_plan_terapeutico_id,
    new_tamizaje_id,
    new_transicion_id,
    new_usuario_id,
)
from app.domain.shared.result import Err, Ok


def test_id_generation_returns_unique_strings() -> None:
    p1 = new_paciente_id()
    p2 = new_paciente_id()
    assert p1 != p2
    assert isinstance(p1, str)
    assert len(p1) > 10

    assert new_cuidador_id() != new_cuidador_id()
    assert new_caso_id() != new_caso_id()
    assert new_tamizaje_id() != new_tamizaje_id()
    assert new_cita_id() != new_cita_id()
    assert new_nota_clinica_id() != new_nota_clinica_id()
    assert new_plan_terapeutico_id() != new_plan_terapeutico_id()
    assert new_usuario_id() != new_usuario_id()
    assert new_transicion_id() != new_transicion_id()
    assert new_evento_id() != new_evento_id()
    assert new_actividad_id() != new_actividad_id()


def test_result_ok_and_err() -> None:
    ok_res = Ok(42)
    assert ok_res.is_ok() is True
    assert ok_res.is_err() is False
    assert ok_res.unwrap() == 42
    with pytest.raises(ValueError, match="Called unwrap_err on Ok"):
        ok_res.unwrap_err()

    err_res = Err("something went wrong")
    assert err_res.is_ok() is False
    assert err_res.is_err() is True
    assert err_res.unwrap_err() == "something went wrong"
    with pytest.raises(ValueError, match="Called unwrap on Err"):
        err_res.unwrap()


def test_domain_error_hierarchy() -> None:
    err = DomainError("generic error", error_type="custom_type", details={"a": 1})
    assert err.message == "generic error"
    assert err.error_type == "custom_type"
    assert err.details == {"a": 1}

    nf = EntityNotFoundError("Paciente", "123")
    assert nf.error_type == "not_found"
    assert nf.details["entity_id"] == "123"

    it = InvalidTransitionError("DETECTADO", "EN_TERAPIA", "No permitido")
    assert it.error_type == "invalid_transition"
    assert "No permitido" in it.message

    bv = BusinessRuleViolationError("rule_1", "Rule violated", {"key": "val"})
    assert bv.error_type == "business_rule_violation"
    assert bv.details["rule_name"] == "rule_1"

    ic = InvalidCatalogError("Catalog error", {"catalog": "1.0"})
    assert ic.error_type == "invalid_catalog"

    ac = ActiveCaseConflictError("pac-1", "case-1")
    assert ac.error_type == "active_case_conflict"
