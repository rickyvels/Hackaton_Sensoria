import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { MemoryRouter } from "react-router-dom"

import { LanguageProvider } from "./LanguageContext"
import { LANGUAGES, PLANNED_LANGUAGES, strings } from "./strings"
import { LanguageSheet } from "@/components/layout/LanguageSheet"
import { BottomNavBar } from "@/components/layout/BottomNavBar"

function renderSheet() {
  return render(
    <LanguageProvider>
      <LanguageSheet open onOpenChange={() => {}} />
    </LanguageProvider>,
  )
}

describe("diccionario", () => {
  it("traduce cada clave a todos los idiomas ofrecidos", () => {
    const offered = LANGUAGES.map((option) => option.id)

    for (const [key, copy] of Object.entries(strings)) {
      for (const lang of offered) {
        // `clinicalSpanishNotice` está vacío en español a propósito: el aviso solo
        // aparece cuando la interfaz no está en español.
        if (key === "clinicalSpanishNotice" && lang === "es") {
          continue
        }
        expect(copy[lang], `Falta ${lang} en la clave "${key}"`).toBeTruthy()
      }
    }
  })
})

describe("LanguageSheet", () => {
  beforeEach(() => window.localStorage.clear())

  it("lista los idiomas disponibles y marca el activo", () => {
    renderSheet()

    expect(screen.getByRole("button", { name: /Español/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Quechua sureño/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /English/ })).toBeInTheDocument()
  })

  it("muestra los idiomas previstos sin ofrecerlos como botón", () => {
    renderSheet()

    for (const planned of PLANNED_LANGUAGES) {
      expect(screen.getByText(planned.name)).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: new RegExp(planned.name) })).not.toBeInTheDocument()
    }
    expect(screen.getAllByText("Próximamente")).toHaveLength(PLANNED_LANGUAGES.length)
  })

  it("cambia el idioma y lo recuerda en localStorage", () => {
    renderSheet()

    fireEvent.click(screen.getByRole("button", { name: /Quechua sureño/ }))

    expect(window.localStorage.getItem("neuroalianza.lang")).toBe("qu")
    expect(document.documentElement.lang).toBe("qu")
  })
})

describe("BottomNavBar traducida", () => {
  beforeEach(() => window.localStorage.clear())

  it("muestra las etiquetas en español por defecto", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <LanguageProvider>
          <BottomNavBar />
        </LanguageProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText("Recursos")).toBeInTheDocument()
    expect(screen.getByText("Citas")).toBeInTheDocument()
  })

  it("muestra las etiquetas en quechua cuando ese idioma está guardado", () => {
    window.localStorage.setItem("neuroalianza.lang", "qu")

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <LanguageProvider>
          <BottomNavBar />
        </LanguageProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText("Qallariy")).toBeInTheDocument()
    expect(screen.getByText("Yanapaqkuna")).toBeInTheDocument()
    expect(screen.queryByText("Recursos")).not.toBeInTheDocument()
  })
})
