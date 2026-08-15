import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { AuthProvider, DEMO_DNI } from "@/context/AuthContext"
import { RequireFamilySession } from "@/components/auth/RequireFamilySession"
import { FamilyAccessPage } from "./FamilyAccessPage"

function renderAccess(initialEntry = "/acceso") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/acceso" element={<FamilyAccessPage />} />
          <Route
            path="/app"
            element={
              <RequireFamilySession>
                <p>Aplicación abierta</p>
              </RequireFamilySession>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function openRegisterTab() {
  fireEvent.click(screen.getByRole("tab", { name: "Registrarme" }))
}

function fillRegistration(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    "DNI del acompañante": "87654321",
    "Crea tu contraseña": "clave12345",
    "Repite tu contraseña": "clave12345",
    "Tu nombre completo": "Rosa Quispe",
    "Nombre del niño, niña o adolescente": "Luana Quispe",
    "Edad del niño o niña en meses": "9",
    "Vínculo contigo": "Madre",
    "Teléfono de contacto": "999888777",
    Distrito: "Ate",
    ...overrides,
  }

  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
}

function acceptConsent() {
  fireEvent.click(
    screen.getByLabelText(/Confirmo que estos datos se usarán/),
  )
}

describe("FamilyAccessPage", () => {
  beforeEach(() => window.sessionStorage.clear())

  it("protege la aplicación y envía al acceso cuando no hay sesión", () => {
    renderAccess("/app")

    expect(screen.queryByText("Aplicación abierta")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Acompaña su ruta paso a paso." })).toBeInTheDocument()
  })

  it("permite entrar con la cuenta de demostración", () => {
    renderAccess()

    fireEvent.change(screen.getByLabelText("DNI"), { target: { value: DEMO_DNI } })
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "loquesea" } })
    fireEvent.click(screen.getByRole("button", { name: /Ingresar a mi ruta/ }))

    expect(screen.getByText("Aplicación abierta")).toBeInTheDocument()
  })

  it("rechaza un DNI que no está registrado", () => {
    renderAccess()

    fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "00000000" } })
    fireEvent.click(screen.getByRole("button", { name: /Ingresar a mi ruta/ }))

    expect(screen.getByRole("alert")).toHaveTextContent("No encontramos ese DNI")
  })

  it("ofrece los cinco tipos de seguro de la libreta CRED", () => {
    renderAccess()
    openRegisterTab()

    for (const label of ["SIS", "EsSalud", "EPS", "PNP / FFAA", "Otro"]) {
      expect(screen.getByRole("radio", { name: new RegExp(label.replace("/", "\\/")) })).toBeInTheDocument()
    }
    expect(screen.getByText("Seguro Integral de Salud")).toBeInTheDocument()
  })

  it("pide detallar el seguro solo cuando se elige «Otro»", () => {
    renderAccess()
    openRegisterTab()

    expect(screen.queryByLabelText("¿Cuál?")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("radio", { name: /Otro/ }))
    expect(screen.getByLabelText("¿Cuál?")).toBeInTheDocument()
  })

  it("registra a la familia guardando el seguro elegido y abre la aplicación", () => {
    renderAccess()
    openRegisterTab()
    fillRegistration()
    fireEvent.click(screen.getByRole("radio", { name: /EsSalud/ }))
    fireEvent.change(screen.getByLabelText("Número de afiliación (opcional)"), {
      target: { value: "445566" },
    })
    acceptConsent()
    fireEvent.click(screen.getByRole("button", { name: /Crear mi acceso y entrar/ }))

    expect(screen.getByText("Aplicación abierta")).toBeInTheDocument()

    const stored = JSON.parse(
      window.sessionStorage.getItem("neuroalianza.preview.family-session") ?? "{}",
    )
    expect(stored.insurance).toBe("essalud")
    expect(stored.insuranceLabel).toBe("EsSalud")
    expect(stored.insuranceCode).toBe("445566")
    expect(stored.patientName).toBe("Luana Quispe")
    expect(stored.patientAgeMonths).toBe(9)
  })

  it("no registra con una edad fuera del rango de la libreta", () => {
    renderAccess()
    openRegisterTab()
    fillRegistration({ "Edad del niño o niña en meses": "400" })
    acceptConsent()
    fireEvent.click(screen.getByRole("button", { name: /Crear mi acceso y entrar/ }))

    expect(screen.getByRole("alert")).toHaveTextContent("entre 0 y 216 meses")
  })

  it("guarda el texto libre cuando el seguro es «Otro»", () => {
    renderAccess()
    openRegisterTab()
    fillRegistration()
    fireEvent.click(screen.getByRole("radio", { name: /Otro/ }))
    fireEvent.change(screen.getByLabelText("¿Cuál?"), { target: { value: "Sin seguro" } })
    acceptConsent()
    fireEvent.click(screen.getByRole("button", { name: /Crear mi acceso y entrar/ }))

    const stored = JSON.parse(
      window.sessionStorage.getItem("neuroalianza.preview.family-session") ?? "{}",
    )
    expect(stored.insurance).toBe("otro")
    expect(stored.insuranceLabel).toBe("Sin seguro")
  })

  it("no registra si el seguro «Otro» queda sin detallar", () => {
    renderAccess()
    openRegisterTab()
    fillRegistration()
    fireEvent.click(screen.getByRole("radio", { name: /Otro/ }))
    acceptConsent()
    fireEvent.click(screen.getByRole("button", { name: /Crear mi acceso y entrar/ }))

    expect(screen.getByRole("alert")).toHaveTextContent("Indica cuál es el seguro")
    expect(screen.queryByText("Aplicación abierta")).not.toBeInTheDocument()
  })

  it("no registra si las contraseñas no coinciden", () => {
    renderAccess()
    openRegisterTab()
    fillRegistration({ "Repite tu contraseña": "otraClave99" })
    acceptConsent()
    fireEvent.click(screen.getByRole("button", { name: /Crear mi acceso y entrar/ }))

    expect(screen.getByRole("alert")).toHaveTextContent("no coinciden")
  })

  it("no registra sin marcar el consentimiento", () => {
    renderAccess()
    openRegisterTab()
    fillRegistration()
    fireEvent.click(screen.getByRole("button", { name: /Crear mi acceso y entrar/ }))

    expect(screen.getByRole("alert")).toHaveTextContent("Confirma el uso de los datos")
  })

  it("reconoce en «Ingresar» un DNI creado durante la sesión", () => {
    const { unmount } = renderAccess()
    openRegisterTab()
    fillRegistration()
    acceptConsent()
    fireEvent.click(screen.getByRole("button", { name: /Crear mi acceso y entrar/ }))
    unmount()

    window.sessionStorage.removeItem("neuroalianza.preview.family-session")
    renderAccess()
    fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "87654321" } })
    fireEvent.click(screen.getByRole("button", { name: /Ingresar a mi ruta/ }))

    expect(screen.getByText("Aplicación abierta")).toBeInTheDocument()
  })
})
