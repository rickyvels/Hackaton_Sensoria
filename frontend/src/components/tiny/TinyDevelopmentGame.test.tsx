import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router-dom"

import { CaseProvider } from "@/context/CaseContext"
import { TinyProgressProvider } from "@/context/TinyProgressContext"
import { TinyDevelopmentGame } from "./TinyDevelopmentGame"

function renderGame(onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <CaseProvider>
        <TinyProgressProvider>
          <TinyDevelopmentGame isOpen onClose={onClose} />
        </TinyProgressProvider>
      </CaseProvider>
    </MemoryRouter>,
  )
}

/** Avanza por todas las tarjetas usando el botón indicado en cada tipo. */
function answerEveryCard(options: { milestonesAchieved: boolean; alertsObserved: boolean }) {
  for (let guard = 0; guard < 30; guard += 1) {
    const alertButton = screen.queryByRole("button", {
      name: options.alertsObserved ? "Sí, he notado esto" : "No lo he notado",
    })
    if (alertButton) {
      fireEvent.click(alertButton)
      continue
    }

    const milestoneButton = screen.queryByRole("button", {
      name: options.milestonesAchieved ? "¡Sí, lo hace!" : "Aún no / a veces",
    })
    if (milestoneButton) {
      fireEvent.click(milestoneButton)
      continue
    }

    return
  }
  throw new Error("El mazo no terminó dentro del límite esperado de tarjetas.")
}

function startRun(stageLabel: string) {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }))
  fireEvent.click(screen.getByRole("button", { name: new RegExp(stageLabel) }))
  fireEvent.click(screen.getByRole("button", { name: "Empezar" }))
}

describe("TinyDevelopmentGame", () => {
  beforeEach(() => window.sessionStorage.clear())

  it("no renderiza nada cuando está cerrado", () => {
    render(
      <MemoryRouter>
        <CaseProvider>
          <TinyProgressProvider>
            <TinyDevelopmentGame isOpen={false} onClose={vi.fn()} />
          </TinyProgressProvider>
        </CaseProvider>
      </MemoryRouter>,
    )

    expect(screen.queryByTestId("tiny-game")).not.toBeInTheDocument()
  })

  it("presenta a Tiny y pide la edad antes de tamizar", () => {
    renderGame()

    expect(screen.getByText("¡Hola! Soy Tiny")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))
    expect(screen.getByRole("heading", { name: "¿Cuántos meses tiene?" })).toBeInTheDocument()
  })

  it("marca la edad del niño activo como sugerida", () => {
    renderGame()
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))

    // El paciente activo de la demo tiene 18 meses.
    expect(screen.getByRole("button", { name: /18 meses/ })).toHaveTextContent("Su edad")
  })

  it("entrega semáforo verde cuando todos los hitos están logrados y no hay alertas", () => {
    renderGame()
    startRun("12 meses")
    answerEveryCard({ milestonesAchieved: true, alertsObserved: false })

    expect(screen.getByTestId("tiny-result")).toHaveAttribute("data-level", "verde")
    expect(
      screen.getByRole("heading", { name: "Su desarrollo va dentro de lo esperado" }),
    ).toBeInTheDocument()
  })

  it("entrega semáforo rojo y muestra las señales de alto riesgo cuando se marca una alerta", () => {
    renderGame()
    startRun("12 meses")
    answerEveryCard({ milestonesAchieved: true, alertsObserved: true })

    expect(screen.getByTestId("tiny-result")).toHaveAttribute("data-level", "rojo")
    expect(screen.getByRole("heading", { name: "Llévalo de inmediato si:" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Señales que marcaste" })).toBeInTheDocument()
  })

  it("entrega semáforo rojo cuando faltan tres o más hitos", () => {
    renderGame()
    startRun("12 meses")
    answerEveryCard({ milestonesAchieved: false, alertsObserved: false })

    expect(screen.getByTestId("tiny-result")).toHaveAttribute("data-level", "rojo")
  })

  it("acumula NeuroCoins mientras la familia responde", () => {
    renderGame()
    const badgeBefore = screen.getByTestId("neurocoins-badge").textContent

    startRun("12 meses")
    fireEvent.click(screen.getByRole("button", { name: "¡Sí, lo hace!" }))

    expect(screen.getByTestId("neurocoins-badge").textContent).not.toBe(badgeBefore)
  })

  it("avisa que las monedas no dependen de la respuesta elegida", () => {
    renderGame()
    startRun("12 meses")

    expect(screen.getByText(/respondas lo que respondas/)).toBeInTheDocument()
  })

  it("cierra el juego con el botón de salida", () => {
    const onClose = vi.fn()
    renderGame(onClose)

    fireEvent.click(screen.getByRole("button", { name: "Cerrar el juego de Tiny" }))
    expect(onClose).toHaveBeenCalled()
  })

  it("recuerda el saldo de NeuroCoins entre aperturas", () => {
    const { unmount } = renderGame()
    startRun("12 meses")
    fireEvent.click(screen.getByRole("button", { name: "¡Sí, lo hace!" }))
    const earned = screen.getByTestId("neurocoins-badge").textContent
    unmount()

    renderGame()
    expect(screen.getByTestId("neurocoins-badge").textContent).toBe(earned)
  })
})
