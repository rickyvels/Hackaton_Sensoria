import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"

/**
 * Envía a la pantalla de acceso cuando no hay sesión familiar y recuerda la
 * ruta pedida para volver a ella después de entrar.
 *
 * Es una barrera de navegación de la vista previa, no un control de seguridad:
 * la sesión se resuelve en el navegador. Ver `AuthContext`.
 */
export function RequireFamilySession({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return (
      <Navigate
        to="/acceso"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <>{children}</>
}
