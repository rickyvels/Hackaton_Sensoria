import React, { createContext, useContext, useRef, useState } from "react"

export interface Patient {
  id: string
  name: string
  ageMonths: number
  ageDisplay: string
  dni: string
  guardian: string
  phone: string
  origin: string
  riskLevel: "bajo" | "medio" | "alto"
  riskLabel: string
  daysInCurrentState: number
  status: "tamizaje_completado" | "derivado" | "cita_programada" | "en_evaluacion" | "plan_activo" | "contrarreferido"
  statusLabel: string
  lastScreeningScore?: string
  lastUpdate: string
}

export interface ScreeningAnswer {
  questionId: number
  answer: boolean
}

export interface ReferralData {
  patientId: string
  findings: string[]
  priority: "alta" | "media" | "ordinaria"
  notes: string
  targetCenter: string
  referralCode: string
  createdAt: string
}

export interface ChildProfileUpdate {
  name: string
  ageMonths: number
  guardian: string
  phone: string
}

interface CaseContextType {
  patients: Patient[]
  referrals: ReferralData[]
  activePatient: Patient | null
  setActivePatient: (patient: Patient | null) => void
  addScreeningResult: (patientData: Partial<Patient>, answers: Record<number, boolean>, risk: "bajo" | "medio" | "alto") => string
  submitReferral: (referral: Omit<ReferralData, "referralCode" | "createdAt">) => string
  updatePatientStatus: (patientId: string, status: Patient["status"], statusLabel: string) => void
  updateChildProfile: (patientId: string, profile: ChildProfileUpdate) => void
}

const INITIAL_PATIENTS: Patient[] = [
  {
    id: "pat-1",
    name: "Mateo Jimenez Ramos",
    ageMonths: 18,
    ageDisplay: "18 meses",
    dni: "78349201",
    guardian: "Elena Ramos (Madre)",
    phone: "+51 984 123 456",
    origin: "C.S. San Juan de Lurigancho",
    riskLevel: "alto",
    riskLabel: "Alto Riesgo",
    daysInCurrentState: 4,
    status: "derivado",
    statusLabel: "Derivado a Tele-Interconsulta",
    lastScreeningScore: "4/5 fallas críticas",
    lastUpdate: "Hace 15 min",
  },
  {
    id: "pat-2",
    name: "Sofía Huamán Castro",
    ageMonths: 24,
    ageDisplay: "24 meses",
    dni: "79102455",
    guardian: "Carlos Huamán (Padre)",
    phone: "+51 971 889 231",
    origin: "Puesto de Salud Huaycán",
    riskLevel: "medio",
    riskLabel: "Riesgo Moderado",
    daysInCurrentState: 12,
    status: "cita_programada",
    statusLabel: "Cita en Neuropediatría",
    lastScreeningScore: "2/5 fallas",
    lastUpdate: "Hace 2 días",
  },
  {
    id: "pat-3",
    name: "Lucas Mendoza Vera",
    ageMonths: 12,
    ageDisplay: "12 meses",
    dni: "77651209",
    guardian: "María Vera (Madre)",
    phone: "+51 955 674 120",
    origin: "C.S. Santa Anita",
    riskLevel: "bajo",
    riskLabel: "Bajo Riesgo",
    daysInCurrentState: 1,
    status: "tamizaje_completado",
    statusLabel: "Control CRED Habitual",
    lastScreeningScore: "0/5 fallas",
    lastUpdate: "Hoy · 09:00 AM",
  },
]

const CHILD_PROFILE_STORAGE_KEY = "neuroalianza.preview.child-profile"
const REFERRAL_SEQUENCE_STORAGE_KEY = "neuroalianza.preview.referral-sequence"

interface StoredChildProfile {
  patientId: string
  profile: ChildProfileUpdate
}

function getInitialPatients(): Patient[] {
  if (typeof window === "undefined") {
    return INITIAL_PATIENTS
  }

  try {
    const storedValue = window.sessionStorage.getItem(CHILD_PROFILE_STORAGE_KEY)
    if (!storedValue) {
      return INITIAL_PATIENTS
    }

    const storedProfile = JSON.parse(storedValue) as StoredChildProfile
    if (!storedProfile.patientId || !storedProfile.profile) {
      return INITIAL_PATIENTS
    }

    return INITIAL_PATIENTS.map((patient) =>
      patient.id === storedProfile.patientId
        ? {
            ...patient,
            ...storedProfile.profile,
            ageDisplay: `${storedProfile.profile.ageMonths} meses`,
          }
        : patient,
    )
  } catch {
    return INITIAL_PATIENTS
  }
}

function getReferralSequence(): number {
  if (typeof window === "undefined") {
    return 1000
  }

  try {
    const storedValue = Number(window.sessionStorage.getItem(REFERRAL_SEQUENCE_STORAGE_KEY))
    return Number.isInteger(storedValue) && storedValue >= 1000 ? storedValue : 1000
  } catch {
    return 1000
  }
}

const CaseContext = createContext<CaseContextType | undefined>(undefined)

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const initialPatients = getInitialPatients()
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [activePatient, setActivePatient] = useState<Patient | null>(initialPatients[0])
  const referralSequence = useRef(getReferralSequence())

  const addScreeningResult = (
    patientData: Partial<Patient>,
    answers: Record<number, boolean>,
    risk: "bajo" | "medio" | "alto"
  ) => {
    const newId = `pat-${Date.now()}`
    const riskLabel = risk === "alto" ? "Alto Riesgo" : risk === "medio" ? "Riesgo Moderado" : "Bajo Riesgo"
    const failureCount = Object.values(answers).filter((v) => !v).length

    const newPatient: Patient = {
      id: newId,
      name: patientData.name || "Paciente Sin Nombre",
      ageMonths: patientData.ageMonths || 18,
      ageDisplay: `${patientData.ageMonths || 18} meses`,
      dni: patientData.dni || "00000000",
      guardian: patientData.guardian || "Apoderado",
      phone: patientData.phone || "+51 900 000 000",
      origin: patientData.origin || "C.S. Primer Nivel",
      riskLevel: risk,
      riskLabel,
      daysInCurrentState: 0,
      status: risk === "alto" ? "derivado" : "tamizaje_completado",
      statusLabel: risk === "alto" ? "Derivación Pendiente" : "Control CRED Habitual",
      lastScreeningScore: `${failureCount}/5 fallas`,
      lastUpdate: "Recién registrado",
    }

    setPatients((prev) => [newPatient, ...prev])
    setActivePatient(newPatient)
    return newId
  }

  const submitReferral = (referral: Omit<ReferralData, "referralCode" | "createdAt">) => {
    const code = `REF-2026-${referralSequence.current++}`
    try {
      window.sessionStorage.setItem(REFERRAL_SEQUENCE_STORAGE_KEY, String(referralSequence.current))
    } catch {
      // El código seguirá siendo único mientras este proveedor permanezca montado.
    }
    const newReferral: ReferralData = {
      ...referral,
      referralCode: code,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setReferrals((prev) => [newReferral, ...prev])
    updatePatientStatus(referral.patientId, "derivado", "Derivado a INSN San Borja")
    return code
  }

  const updatePatientStatus = (patientId: string, status: Patient["status"], statusLabel: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status, statusLabel, daysInCurrentState: 0, lastUpdate: "Hoy" } : p))
    )
  }

  const updateChildProfile = (patientId: string, profile: ChildProfileUpdate) => {
    const ageDisplay = `${profile.ageMonths} meses`
    const updatePatient = (patient: Patient) =>
      patient.id === patientId
        ? {
            ...patient,
            ...profile,
            ageDisplay,
            lastUpdate: "Información actualizada",
          }
        : patient

    setPatients((prev) => prev.map(updatePatient))
    setActivePatient((prev) => (prev ? updatePatient(prev) : prev))
    try {
      window.sessionStorage.setItem(
        CHILD_PROFILE_STORAGE_KEY,
        JSON.stringify({ patientId, profile } satisfies StoredChildProfile),
      )
    } catch {
      // La vista previa conserva los cambios mientras el proveedor siga montado.
    }
  }

  return (
    <CaseContext.Provider
      value={{
        patients,
        referrals,
        activePatient,
        setActivePatient,
        addScreeningResult,
        submitReferral,
        updatePatientStatus,
        updateChildProfile,
      }}
    >
      {children}
    </CaseContext.Provider>
  )
}

export function useCase() {
  const context = useContext(CaseContext)
  if (!context) {
    throw new Error("useCase must be used within a CaseProvider")
  }
  return context
}

export function useOptionalCase() {
  return useContext(CaseContext)
}
