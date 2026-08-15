import React, { createContext, useCallback, useContext, useState } from "react"

import type { SemaforoLevel } from "@/services/tinyScreening"

export interface TinyRun {
  /** Etapa CRED jugada, en meses. */
  ageMonths: number
  label: string
  level: SemaforoLevel
  missedMilestones: number
  activeAlerts: number
  coinsEarned: number
  completedAt: string
}

interface TinyProgressContextType {
  neuroCoins: number
  runs: TinyRun[]
  lastRun: TinyRun | null
  addCoins: (amount: number) => void
  registerRun: (run: TinyRun) => void
  resetProgress: () => void
}

const COINS_STORAGE_KEY = "neuroalianza.preview.tiny-coins"
const RUNS_STORAGE_KEY = "neuroalianza.preview.tiny-runs"
const MAX_STORED_RUNS = 10

function readStoredCoins(): number {
  if (typeof window === "undefined") {
    return 0
  }

  try {
    const storedValue = Number(window.sessionStorage.getItem(COINS_STORAGE_KEY))
    return Number.isInteger(storedValue) && storedValue >= 0 ? storedValue : 0
  } catch {
    return 0
  }
}

function readStoredRuns(): TinyRun[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const storedValue = window.sessionStorage.getItem(RUNS_STORAGE_KEY)
    if (!storedValue) {
      return []
    }
    const parsed = JSON.parse(storedValue) as TinyRun[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // La vista previa conserva el avance mientras el proveedor siga montado.
  }
}

const TinyProgressContext = createContext<TinyProgressContextType | undefined>(undefined)

export function TinyProgressProvider({ children }: { children: React.ReactNode }) {
  const [neuroCoins, setNeuroCoins] = useState<number>(readStoredCoins)
  const [runs, setRuns] = useState<TinyRun[]>(readStoredRuns)

  const addCoins = useCallback((amount: number) => {
    if (amount <= 0) {
      return
    }
    setNeuroCoins((previous) => {
      const next = previous + amount
      persist(COINS_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const registerRun = useCallback((run: TinyRun) => {
    setRuns((previous) => {
      const next = [run, ...previous].slice(0, MAX_STORED_RUNS)
      persist(RUNS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    setNeuroCoins(0)
    setRuns([])
    persist(COINS_STORAGE_KEY, "0")
    persist(RUNS_STORAGE_KEY, "[]")
  }, [])

  return (
    <TinyProgressContext.Provider
      value={{
        neuroCoins,
        runs,
        lastRun: runs[0] ?? null,
        addCoins,
        registerRun,
        resetProgress,
      }}
    >
      {children}
    </TinyProgressContext.Provider>
  )
}

export function useTinyProgress() {
  const context = useContext(TinyProgressContext)
  if (!context) {
    throw new Error("useTinyProgress must be used within a TinyProgressProvider")
  }
  return context
}

/** Variante segura para componentes que pueden montarse fuera del proveedor. */
export function useOptionalTinyProgress() {
  return useContext(TinyProgressContext)
}
