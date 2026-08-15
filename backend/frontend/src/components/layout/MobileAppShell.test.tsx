import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { MobileAppShell } from "./MobileAppShell"

describe("MobileAppShell Component", () => {
  it("renderiza correctamente como alias de MobileAppLayout", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <MobileAppShell>
          <div data-testid="test-content">Contenido de prueba</div>
        </MobileAppShell>
      </MemoryRouter>
    )

    // Verifica contenedor móvil
    expect(screen.getByTestId("mobile-app-shell")).toBeInTheDocument()

    // Verifica contenido principal
    expect(screen.getByTestId("test-content")).toBeInTheDocument()

    // Verifica elementos de navegación inferior
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Recursos")).toBeInTheDocument()
    expect(screen.getByText("Citas")).toBeInTheDocument()
    expect(screen.getByText("Perfil")).toBeInTheDocument()
  })
})
