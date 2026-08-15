# 🧪 Estrategia y Guía de Testing del Frontend — Neuroalianza (PWA)

> **Regla de Oro del Proyecto:** *Cada componente interactivo de shadcn/ui, formulario de tamizaje o integración con la API DEBE contar con pruebas automatizadas que garanticen su funcionalidad y accesibilidad.*

---

## 1. Pirámide de Pruebas del Frontend

```
                      ▲
                     / \
                    /   \   Pruebas E2E de Flujo Clínico (Playwright Mobile) [~10%]
                   /─────\
                  /       \  Auditoría Automática de Accesibilidad (axe-core) [~20%]
                 /─────────\
                /           \ Pruebas de Integración de Features (React Query + MSW) [~30%]
               /─────────────\
              /               \ Pruebas Unitarias de Componentes shadcn (Testing Library + Vitest) [~40%]
             /─────────────────\
```

| Nivel | Herramienta | Alcance |
| :--- | :--- | :--- |
| **1. Unitarias de Componente** | Vitest + React Testing Library | Renderizado de componentes shadcn/ui, validación de inputs, eventos táctiles y tokens. |
| **2. Integración de Features** | React Testing Library + MSW | Flujo de cuestionario de tamizaje, selección de opciones y cálculo visual de riesgo. |
| **3. Auditoría de Accesibilidad** | `@axe-core/react` / vitest-axe | Detección automática de violaciones WCAG (contraste, etiquetas faltantes, roles ARIA). |
| **4. Integración E2E Móvil** | Playwright (Mobile Emulation) | Recorrido completo dentro del layout `MobileAppShell` (móvil y desktop). |

---

## 2. Pruebas Unitarias con Vitest y shadcn/ui

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ScreeningWizard } from "@/features/screening/components/ScreeningWizard";

describe("ScreeningWizard Component", () => {
  it("debe requerir respuesta en todas las preguntas antes de permitir el envío", async () => {
    const onSubmit = vi.fn();
    render(<ScreeningWizard ageMonths={18} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole("button", { name: /calcular nivel de riesgo/i });
    expect(submitButton).toBeDisabled();

    // Responder preguntas obligatorias en el cuestionario móvil
    const options = screen.getAllByRole("radio", { name: /sí|no/i });
    options.forEach((option) => fireEvent.click(option));

    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
```

---

## 3. Pruebas de Accesibilidad Automáticas (a11y)

```tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { SemaforoRiesgo } from "@/components/shared/SemaforoRiesgo";

expect.extend(toHaveNoViolations);

it("el semáforo de riesgo no debe presentar violaciones de accesibilidad", async () => {
  const { container } = render(<SemaforoRiesgo nivel="ALTO" justificacion="2 alertas críticas" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 4. Mocks de API y Contrato OpenAPI (MSW)

Mock Service Worker simula las respuestas del backend OpenAPI para ejecución offline en tests:
* `GET /api/v1/screening/catalog?age_months=18` $\rightarrow$ Preguntas del catálogo M-CHAT-R/F.
* `POST /api/v1/screening/applications` $\rightarrow$ Cálculo puro de riesgo.
* `POST /api/v1/family/appointments/:id/decline` $\rightarrow$ Valida motivo estructurado.

---

## 5. Comandos de Ejecución

```bash
# Ejecutar todas las pruebas unitarias y de integración
npm run test

# Ejecutar pruebas con interfaz visual interactiva
npm run test:ui

# Ejecutar reporte de cobertura de código
npm run test:coverage
```
