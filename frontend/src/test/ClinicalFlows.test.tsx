import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { CaseProvider } from "@/context/CaseContext"
import { NewScreeningPage } from "@/pages/health-worker/NewScreeningPage"
import { ScreeningResultPage } from "@/pages/health-worker/ScreeningResultPage"
import { FamilyRoadmapPage } from "@/pages/family/FamilyRoadmapPage"
import { CaseDetailPage } from "@/pages/specialist/CaseDetailPage"
import { ClinicalMetricsPage } from "@/pages/specialist/ClinicalMetricsPage"

describe("Neuroalianza Phase 3, 4, 5 & 6 Components", () => {
  it("renders NewScreeningPage and allows completing the screening wizard", () => {
    render(
      <MemoryRouter>
        <CaseProvider>
          <NewScreeningPage />
        </CaseProvider>
      </MemoryRouter>
    )

    // Paso 1: Identificación
    expect(screen.getByText(/Nuevo Tamizaje CRED/i)).toBeInTheDocument()
    const startButton = screen.getByRole("button", { name: /Iniciar Cuestionario/i })
    fireEvent.click(startButton)

    // Paso 2: Cuestionario - Responder acorde al desarrollo típico (1: Sí, 2: No, 3: Sí, 4: Sí, 5: No)
    // Q1: Sí
    fireEvent.click(screen.getByRole("button", { name: /SÍ/i }))
    // Q2: No (no sordera)
    fireEvent.click(screen.getByRole("button", { name: /NO/i }))
    // Q3: Sí (juego simbólico)
    fireEvent.click(screen.getByRole("button", { name: /SÍ/i }))
    // Q4: Sí (trepar)
    fireEvent.click(screen.getByRole("button", { name: /SÍ/i }))
    // Q5: No (no aleteo)
    fireEvent.click(screen.getByRole("button", { name: /NO/i }))

    // Paso 3: Resultado
    expect(screen.getByText(/Desarrollo Acorde a la Edad/i)).toBeInTheDocument()
    expect(screen.getByText(/Orientación preventiva/i)).toBeInTheDocument()
  })

  it("renders ScreeningResultPage and displays structured findings", () => {
    render(
      <MemoryRouter>
        <CaseProvider>
          <ScreeningResultPage />
        </CaseProvider>
      </MemoryRouter>
    )

    expect(screen.getByText(/Mateo Jimenez Ramos/i)).toBeInTheDocument()
    expect(screen.getByText(/Hallazgos clínicos observados/i)).toBeInTheDocument()
    expect(screen.getByText(/Emitir Derivación a INSN San Borja/i)).toBeInTheDocument()
  })

  it("renders FamilyRoadmapPage with vertical steps and decline modal", () => {
    render(
      <MemoryRouter>
        <CaseProvider>
          <FamilyRoadmapPage />
        </CaseProvider>
      </MemoryRouter>
    )

    expect(screen.getByText(/Mi Ruta de Atención/i)).toBeInTheDocument()
    expect(screen.getByText(/1\. Detección Temprana en Posta CRED/i)).toBeInTheDocument()
    expect(screen.getByText(/3\. Evaluación Multidisciplinaria Presencial/i)).toBeInTheDocument()
  })

  it("renders CaseDetailPage with clinical tabs", () => {
    render(
      <MemoryRouter>
        <CaseProvider>
          <CaseDetailPage />
        </CaseProvider>
      </MemoryRouter>
    )

    expect(screen.getByText(/Mateo Jimenez Ramos/i)).toBeInTheDocument()
    expect(screen.getByText(/Notas Clínicas/i)).toBeInTheDocument()
    expect(screen.getByText(/Neuropediatría/i)).toBeInTheDocument()
  })

  it("renders ClinicalMetricsPage with KPI cards", () => {
    render(
      <MemoryRouter>
        <ClinicalMetricsPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Métricas de Oportunidad/i)).toBeInTheDocument()
    expect(screen.getByText(/De 8\.5 meses a 14 días/i)).toBeInTheDocument()
    expect(screen.getByText(/Causas Declaradas de Inasistencia/i)).toBeInTheDocument()
  })
})
