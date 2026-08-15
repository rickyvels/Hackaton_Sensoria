import React, { createContext, useCallback, useContext, useState } from "react"

/**
 * Acceso familiar de la vista previa.
 *
 * IMPORTANTE: esto NO es autenticación real. El backend de este repositorio no
 * expone endpoints de sesión, así que el acceso se resuelve en el navegador y
 * solo sirve para recorrer la demostración. No hay contraseñas almacenadas, no
 * hay token verificable y cualquiera puede entrar. Antes de manejar datos de
 * pacientes reales hay que sustituirlo por autenticación en el servidor.
 */

/** Tipos de seguro del formulario "Tipo de seguro" de la Libreta CRED del MINSA. */
export type InsuranceType = "sis" | "essalud" | "eps" | "ffaa" | "otro"

export interface InsuranceOption {
  id: InsuranceType
  label: string
  description: string
}

export const INSURANCE_OPTIONS: InsuranceOption[] = [
  {
    id: "sis",
    label: "SIS",
    description: "Seguro Integral de Salud",
  },
  {
    id: "essalud",
    label: "EsSalud",
    description: "Seguro Social de Salud",
  },
  {
    id: "eps",
    label: "EPS",
    description: "Entidad Prestadora de Salud privada",
  },
  {
    id: "ffaa",
    label: "PNP / FFAA",
    description: "Sanidad policial o de fuerzas armadas",
  },
  {
    id: "otro",
    label: "Otro",
    description: "Otro seguro o sin seguro",
  },
]

export function getInsuranceLabel(insurance: InsuranceType, otherLabel = ""): string {
  if (insurance === "otro") {
    return otherLabel.trim() || "Otro seguro"
  }
  return INSURANCE_OPTIONS.find((option) => option.id === insurance)?.label ?? "Sin registrar"
}

export interface FamilyRegistration {
  dni: string
  companionName: string
  patientName: string
  /** Edad del niño en meses: el resto de la app organiza todo por edad. */
  patientAgeMonths: number
  relationship: string
  phone: string
  district: string
  insurance: InsuranceType
  /** Texto libre cuando `insurance` es "otro". */
  insuranceOther: string
  /** Número de afiliación o autogenerado; opcional. */
  insuranceCode: string
}

export interface FamilySession extends FamilyRegistration {
  insuranceLabel: string
  createdAt: string
}

interface AuthContextType {
  session: FamilySession | null
  /** Cuentas creadas durante esta vista previa, para que "Ingresar" reconozca el DNI. */
  knownDnis: string[]
  signIn: (dni: string) => FamilySession
  register: (registration: FamilyRegistration) => FamilySession
  signOut: () => void
}

const SESSION_STORAGE_KEY = "neuroalianza.preview.family-session"
const ACCOUNTS_STORAGE_KEY = "neuroalianza.preview.family-accounts"

/** Cuenta precargada para recorrer la demostración sin registrarse. */
export const DEMO_DNI = "12345678"

const DEMO_SESSION: FamilySession = {
  dni: DEMO_DNI,
  companionName: "Elena Ramos",
  patientName: "Mateo Jimenez Ramos",
  patientAgeMonths: 18,
  relationship: "Madre",
  phone: "+51 984 123 456",
  district: "San Juan de Lurigancho",
  insurance: "sis",
  insuranceOther: "",
  insuranceCode: "",
  insuranceLabel: "SIS",
  createdAt: "Cuenta de demostración",
}

function readStoredSession(): FamilySession | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const storedValue = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!storedValue) {
      return null
    }
    const parsed = JSON.parse(storedValue) as FamilySession
    return parsed.dni ? parsed : null
  } catch {
    return null
  }
}

function readStoredAccounts(): Record<string, FamilySession> {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const storedValue = window.sessionStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!storedValue) {
      return {}
    }
    const parsed = JSON.parse(storedValue) as Record<string, FamilySession>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function persist(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // La vista previa conserva la sesión mientras el proveedor siga montado.
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<FamilySession | null>(readStoredSession)
  const [accounts, setAccounts] = useState<Record<string, FamilySession>>(readStoredAccounts)

  const signIn = useCallback(
    (dni: string) => {
      const account = dni === DEMO_DNI ? DEMO_SESSION : accounts[dni]
      if (!account) {
        throw new Error("No encontramos ese DNI. Regístrate para crear tu acceso.")
      }
      setSession(account)
      persist(SESSION_STORAGE_KEY, JSON.stringify(account))
      return account
    },
    [accounts],
  )

  const register = useCallback((registration: FamilyRegistration) => {
    const newSession: FamilySession = {
      ...registration,
      insuranceLabel: getInsuranceLabel(registration.insurance, registration.insuranceOther),
      createdAt: new Date().toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    }

    setAccounts((previous) => {
      const next = { ...previous, [newSession.dni]: newSession }
      persist(ACCOUNTS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setSession(newSession)
    persist(SESSION_STORAGE_KEY, JSON.stringify(newSession))
    return newSession
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // Sin almacenamiento la sesión ya desaparece al desmontar el proveedor.
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        knownDnis: [DEMO_DNI, ...Object.keys(accounts)],
        signIn,
        register,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

/** Variante segura para componentes que pueden montarse fuera del proveedor. */
export function useOptionalAuth() {
  return useContext(AuthContext)
}
