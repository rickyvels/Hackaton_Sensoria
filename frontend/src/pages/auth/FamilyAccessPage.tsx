import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Key, ShieldCheck } from "@phosphor-icons/react"

import { BrandMark } from "@/components/layout/BrandMark"
import { Button } from "@/components/ui/button"
import { useOptionalCase } from "@/context/CaseContext"
import { Input } from "@/components/ui/input"
import {
  DEMO_DNI,
  INSURANCE_OPTIONS,
  useAuth,
  type FamilyRegistration,
  type InsuranceType,
} from "@/context/AuthContext"

type AccessMode = "login" | "register"

const EMPTY_REGISTRATION: FamilyRegistration = {
  dni: "",
  companionName: "",
  patientName: "",
  patientAgeMonths: 0,
  relationship: "",
  phone: "",
  district: "",
  insurance: "sis",
  insuranceOther: "",
  insuranceCode: "",
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 16)
}

/** Campo de texto etiquetado, con pista opcional debajo. */
function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-base font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FamilyAccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, register } = useAuth()
  const caseContext = useOptionalCase()

  const [mode, setMode] = useState<AccessMode>("login")
  const [dni, setDni] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [form, setForm] = useState<FamilyRegistration>(EMPTY_REGISTRATION)
  const [ageInput, setAgeInput] = useState("")
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState("")

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/app"

  const update = <Key extends keyof FamilyRegistration>(
    field: Key,
    value: FamilyRegistration[Key],
  ) => setForm((previous) => ({ ...previous, [field]: value }))

  const switchMode = (next: AccessMode) => {
    setMode(next)
    setError("")
  }

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    if (dni.length < 8) {
      setError("Ingresa un DNI de al menos 8 dígitos.")
      return
    }
    try {
      signIn(dni)
      navigate(redirectTo, { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos verificar tus datos.")
    }
  }

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault()

    if (form.dni.length < 8) {
      setError("El DNI debe tener al menos 8 dígitos.")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== passwordConfirm) {
      setError("Las dos contraseñas no coinciden.")
      return
    }
    if (!form.companionName.trim() || !form.patientName.trim()) {
      setError("Necesitamos tu nombre y el del niño, niña o adolescente.")
      return
    }
    const patientAgeMonths = Number(ageInput.trim())
    if (
      !ageInput.trim() ||
      !Number.isInteger(patientAgeMonths) ||
      patientAgeMonths < 0 ||
      patientAgeMonths > 216
    ) {
      setError("Indica una edad entre 0 y 216 meses.")
      return
    }
    if (form.insurance === "otro" && !form.insuranceOther.trim()) {
      setError("Indica cuál es el seguro del paciente.")
      return
    }
    if (!consent) {
      setError("Confirma el uso de los datos para continuar.")
      return
    }

    const registration = {
      ...form,
      patientAgeMonths,
      dni: onlyDigits(form.dni),
      companionName: form.companionName.trim(),
      patientName: form.patientName.trim(),
      relationship: form.relationship.trim() || "Persona cuidadora",
      phone: form.phone.trim(),
      district: form.district.trim(),
      insuranceOther: form.insuranceOther.trim(),
      insuranceCode: form.insuranceCode.trim(),
    }

    register(registration)

    // El niño registrado pasa a ser el caso activo: sin esto "Mi hijo" y el juego
    // de Tiny seguirían mostrando al paciente de demostración.
    if (caseContext?.activePatient) {
      caseContext.updateChildProfile(caseContext.activePatient.id, {
        name: registration.patientName,
        ageMonths: registration.patientAgeMonths,
        guardian: `${registration.companionName} (${registration.relationship})`,
        phone: registration.phone,
      })
    }

    navigate(redirectTo, { replace: true })
  }

  const isLogin = mode === "login"

  return (
    <div className="fixed inset-0 flex h-screen h-[100dvh] w-full items-center justify-center overflow-hidden bg-muted/40 sm:p-4">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-background shadow-2xl sm:h-[90vh] sm:max-h-[96vh] sm:rounded-3xl sm:border sm:border-border/80">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-8">
          {/* Marca */}
          <BrandMark />

          <header className="mt-7 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {isLogin ? "Acceso familiar" : "Crear mi acceso"}
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
              {isLogin ? "Acompaña su ruta paso a paso." : "Empecemos con tus datos."}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              {isLogin
                ? "Consulta el seguimiento, las próximas coordinaciones y avisa si aparece una dificultad."
                : "Elige una contraseña y entra de inmediato. El equipo verificará los datos después."}
            </p>
          </header>

          {/* Pestañas */}
          <div
            role="tablist"
            aria-label="Acceso familiar"
            className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1"
          >
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => switchMode(value)}
                className={`min-h-11 rounded-xl px-4 text-base font-semibold transition-colors ${
                  mode === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "login" ? "Ingresar" : "Registrarme"}
              </button>
            ))}
          </div>

          {isLogin ? (
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <Field id="login-dni" label="DNI">
                <Input
                  id="login-dni"
                  inputMode="numeric"
                  autoComplete="username"
                  value={dni}
                  onChange={(event) => setDni(onlyDigits(event.target.value))}
                />
              </Field>

              <Field id="login-password" label="Contraseña">
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>

              {error && (
                <p role="alert" className="text-base font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="h-12 w-full text-base">
                <Key size={20} weight="fill" />
                Ingresar a mi ruta
              </Button>

              <p className="rounded-xl bg-muted p-3 text-sm leading-relaxed text-muted-foreground">
                Demostración con datos sintéticos. Puedes entrar con el DNI{" "}
                <strong className="text-foreground">{DEMO_DNI}</strong> y cualquier contraseña.
              </p>
            </form>
          ) : (
            /* `noValidate`: la validación vive en `handleRegister` para que todos
               los errores salgan en el mismo `role="alert"` y sean traducibles.
               Los atributos `required` se conservan por accesibilidad. */
            <form className="mt-6 space-y-4" noValidate onSubmit={handleRegister}>
              <Field
                id="reg-dni"
                label="DNI del acompañante"
                hint="Solo números. Será tu usuario para entrar."
              >
                <Input
                  id="reg-dni"
                  required
                  inputMode="numeric"
                  autoComplete="username"
                  value={form.dni}
                  onChange={(event) => update("dni", onlyDigits(event.target.value))}
                />
              </Field>

              <Field id="reg-password" label="Crea tu contraseña" hint="Mínimo 8 caracteres.">
                <Input
                  id="reg-password"
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>

              <Field id="reg-password-confirm" label="Repite tu contraseña">
                <Input
                  id="reg-password-confirm"
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                />
              </Field>

              <Field id="reg-companion" label="Tu nombre completo">
                <Input
                  id="reg-companion"
                  required
                  autoComplete="name"
                  value={form.companionName}
                  onChange={(event) => update("companionName", event.target.value)}
                />
              </Field>

              <Field id="reg-patient" label="Nombre del niño, niña o adolescente">
                <Input
                  id="reg-patient"
                  required
                  value={form.patientName}
                  onChange={(event) => update("patientName", event.target.value)}
                />
              </Field>

              <Field
                id="reg-age"
                label="Edad del niño o niña en meses"
                hint="Con esto ordenamos los hitos, los recursos y el juego de Tiny."
              >
                <Input
                  id="reg-age"
                  required
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="216"
                  value={ageInput}
                  onChange={(event) => setAgeInput(event.target.value)}
                />
              </Field>

              <Field id="reg-relationship" label="Vínculo contigo">
                <Input
                  id="reg-relationship"
                  required
                  placeholder="Madre, padre, tutor/a…"
                  value={form.relationship}
                  onChange={(event) => update("relationship", event.target.value)}
                />
              </Field>

              <Field id="reg-phone" label="Teléfono de contacto">
                <Input
                  id="reg-phone"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                />
              </Field>

              <Field id="reg-district" label="Distrito">
                <Input
                  id="reg-district"
                  required
                  value={form.district}
                  onChange={(event) => update("district", event.target.value)}
                />
              </Field>

              {/* Seguro del paciente — campo "Tipo de seguro" de la Libreta CRED */}
              <fieldset className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <legend className="px-1 text-base font-semibold text-foreground">
                  Seguro del paciente
                </legend>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sirve para saber a qué establecimientos puede ser derivado y qué trámites
                  corresponden.
                </p>

                <div
                  role="radiogroup"
                  aria-label="Tipo de seguro del paciente"
                  className="grid grid-cols-1 gap-2"
                >
                  {INSURANCE_OPTIONS.map((option) => {
                    const isSelected = form.insurance === option.id

                    return (
                      <label
                        key={option.id}
                        className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="insurance"
                          value={option.id}
                          checked={isSelected}
                          onChange={() => update("insurance", option.id as InsuranceType)}
                          className="size-5 shrink-0 accent-primary"
                        />
                        <span className="min-w-0">
                          <span className="block text-base font-semibold text-foreground">
                            {option.label}
                          </span>
                          <span className="block text-sm leading-snug text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>

                {/* Sin `required` nativo: la validación propia muestra el error en el
                    mismo `role="alert"` que el resto del formulario. */}
                {form.insurance === "otro" && (
                  <Field id="reg-insurance-other" label="¿Cuál?">
                    <Input
                      id="reg-insurance-other"
                      placeholder="Nombre del seguro, o «sin seguro»"
                      value={form.insuranceOther}
                      onChange={(event) => update("insuranceOther", event.target.value)}
                    />
                  </Field>
                )}

                <Field
                  id="reg-insurance-code"
                  label="Número de afiliación (opcional)"
                  hint="Si no lo tienes a mano, puedes dejarlo vacío y completarlo después."
                >
                  <Input
                    id="reg-insurance-code"
                    inputMode="numeric"
                    value={form.insuranceCode}
                    onChange={(event) => update("insuranceCode", event.target.value)}
                  />
                </Field>
              </fieldset>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-primary"
                />
                <span className="text-base leading-relaxed text-foreground">
                  Confirmo que estos datos se usarán para revisar mi solicitud y coordinar una ruta.
                </span>
              </label>

              {error && (
                <p role="alert" className="text-base font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="h-12 w-full text-base">
                <ShieldCheck size={20} weight="fill" />
                Crear mi acceso y entrar
              </Button>
            </form>
          )}

          <p className="mt-5 flex gap-2 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheck size={18} weight="fill" className="mt-0.5 shrink-0" />
            <span>
              Acceso de demostración: la contraseña no se guarda ni se verifica, y los datos solo
              viven en esta pestaña del navegador.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
