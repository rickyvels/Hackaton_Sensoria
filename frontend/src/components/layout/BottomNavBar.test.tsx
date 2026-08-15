import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { BottomNavBar } from "./BottomNavBar"
import { House } from "@phosphor-icons/react"

describe("BottomNavBar Component", () => {
  it("renderiza todos los elementos según el diseño de la PWA (Home, Recursos, Citas, Perfil)", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <BottomNavBar />
      </MemoryRouter>
    )

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Recursos")).toBeInTheDocument()
    expect(screen.getByText("Citas")).toBeInTheDocument()
    expect(screen.getByText("Perfil")).toBeInTheDocument()
    expect(screen.getByTestId("nav-center-action")).toBeInTheDocument()
  })

  it("detecta la pestaña activa según la ruta actual en react-router", () => {
    render(
      <MemoryRouter initialEntries={["/app/recursos"]}>
        <BottomNavBar />
      </MemoryRouter>
    )

    const recursosButton = screen.getByTestId("nav-item-recursos")
    expect(recursosButton).toHaveClass("text-primary")
  })

  it("permite pasar una lista de items personalizada", () => {
    const customItems = [
      { id: "custom1", label: "Inicio", to: "/app/custom1", icon: House },
      { id: "custom2", label: "Guías", to: "/app/custom2", icon: House, badgeCount: 4 },
      { id: "custom3", label: "Ruta", to: "/app/custom3", icon: House },
      { id: "custom4", label: "Ajustes", to: "/app/custom4", icon: House },
    ]

    render(
      <MemoryRouter initialEntries={["/app/custom1"]}>
        <BottomNavBar items={customItems} />
      </MemoryRouter>
    )

    expect(screen.getByText("Inicio")).toBeInTheDocument()
    expect(screen.getByText("Guías")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("ejecuta callback onTabChange al hacer clic", () => {
    const onTabChangeMock = vi.fn()
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <BottomNavBar onTabChange={onTabChangeMock} />
      </MemoryRouter>
    )

    const recursosButton = screen.getByTestId("nav-item-recursos")
    fireEvent.click(recursosButton)
    expect(onTabChangeMock).toHaveBeenCalledWith("recursos")
  })

  it("lleva el botón central al perfil del hijo", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/app" element={<BottomNavBar />} />
          <Route path="/app/mi-hijo" element={<p>Perfil de mi hijo</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByTestId("nav-center-action"))
    expect(screen.getByText("Perfil de mi hijo")).toBeInTheDocument()
  })
})
