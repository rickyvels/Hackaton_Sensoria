import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { MemoryRouter } from "react-router-dom"

import { CaseProvider } from "@/context/CaseContext"
import { ChildProfilePage } from "./ChildProfilePage"

describe("ChildProfilePage", () => {
  beforeEach(() => window.sessionStorage.clear())

  it("allows a family member to update the child's basic information", () => {
    const { unmount } = render(<MemoryRouter><CaseProvider><ChildProfilePage /></CaseProvider></MemoryRouter>)
    expect(screen.getByRole("heading", { name: "Mi hijo" })).toBeInTheDocument()
    expect(screen.getByText("Mateo Jimenez Ramos")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Editar información" }))
    fireEvent.change(screen.getByLabelText("Nombre de tu hijo o hija"), { target: { value: "Mateo Ramos" } })
    fireEvent.change(screen.getByLabelText("Edad en meses"), { target: { value: "19" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))

    expect(screen.getByText("Mateo Ramos")).toBeInTheDocument()
    expect(screen.getByText("19 meses")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Información actualizada")

    unmount()
    render(<MemoryRouter><CaseProvider><ChildProfilePage /></CaseProvider></MemoryRouter>)
    expect(screen.getByText("Mateo Ramos")).toBeInTheDocument()
  })

  it("does not accept an empty age", () => {
    render(<MemoryRouter><CaseProvider><ChildProfilePage /></CaseProvider></MemoryRouter>)
    fireEvent.click(screen.getByRole("button", { name: "Editar información" }))
    fireEvent.change(screen.getByLabelText("Edad en meses"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Completa el nombre y una edad")
  })
})
