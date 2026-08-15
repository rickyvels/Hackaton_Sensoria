import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { TopHeader } from "./TopHeader"

describe("TopHeader Component", () => {
  it("renderiza el título, subtítulo/rol y estado online por defecto", () => {
    render(
      <MemoryRouter>
        <TopHeader title="Centro de Salud San Borja" role="Neuropediatría" />
      </MemoryRouter>
    )

    expect(screen.getByText("Centro de Salud San Borja")).toBeInTheDocument()
    expect(screen.getByText("Neuropediatría")).toBeInTheDocument()
    expect(screen.getByText("Online")).toBeInTheDocument()
  })

  it("muestra el badge offline cuando el estado es offline", () => {
    render(
      <MemoryRouter>
        <TopHeader connectionStatus="offline" />
      </MemoryRouter>
    )

    expect(screen.getByText("Offline")).toBeInTheDocument()
  })

  it("soporta botón de retroceso y ejecuta el callback correspondiente", () => {
    const onBackMock = vi.fn()
    render(
      <MemoryRouter>
        <TopHeader showBack={true} onBack={onBackMock} />
      </MemoryRouter>
    )

    const backButton = screen.getByRole("button", { name: /volver atrás/i })
    expect(backButton).toBeInTheDocument()
    fireEvent.click(backButton)
    expect(onBackMock).toHaveBeenCalledTimes(1)
  })

  it("renderiza slots personalizados a la izquierda y derecha", () => {
    render(
      <MemoryRouter>
        <TopHeader
          leftSlot={<span data-testid="custom-left">LOGO</span>}
          rightSlot={<button data-testid="custom-right">PERFIL</button>}
        />
      </MemoryRouter>
    )

    expect(screen.getByTestId("custom-left")).toHaveTextContent("LOGO")
    expect(screen.getByTestId("custom-right")).toHaveTextContent("PERFIL")
  })
})
