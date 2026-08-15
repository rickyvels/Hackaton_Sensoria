import { useState } from "react"
import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"
import { BottomNavBar } from "./BottomNavBar"
import type { BottomNavBarProps } from "./BottomNavBar"
import { AiAssistantModal } from "@/components/ai/AiAssistantModal"
import { TinyDevelopmentGame } from "@/components/tiny/TinyDevelopmentGame"

export interface MobileAppLayoutProps {
  /** Ranura opcional de encabezado personalizado */
  headerSlot?: ReactNode

  /** Ranura modular superior (ej: avisos de emergencia, banners de offline, etc.) */
  topBannerSlot?: ReactNode

  /** Ranura modular debajo del encabezado (ej: barra de búsqueda, tabs secundarios, filtros) */
  subHeaderSlot?: ReactNode

  /** Contenido principal (si no se pasa, renderiza <Outlet /> para react-router) */
  children?: ReactNode

  /** Ranura modular encima del BottomNavBar (ej: botón flotante FAB adicional, reproductor de audio, timer) */
  aboveBottomSlot?: ReactNode

  /** Barra inferior de navegación o componente personalizado */
  bottomSlot?: ReactNode
  /** Ocultar barra inferior */
  hideBottomNav?: boolean
  /** Props para BottomNavBar por defecto */
  bottomNavProps?: BottomNavBarProps

  /** Ranura modular inferior (ej: drawer expandible, panel de depuración) */
  bottomExtensionSlot?: ReactNode

  /** Clases CSS adicionales para el contenedor */
  className?: string
  containerClassName?: string
}

export function MobileAppLayout({
  headerSlot,
  topBannerSlot,
  subHeaderSlot,
  children,
  aboveBottomSlot,

  bottomSlot,
  hideBottomNav = false,
  bottomNavProps,

  bottomExtensionSlot,
  className = "",
  containerClassName = "",
}: MobileAppLayoutProps) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [isTinyGameOpen, setIsTinyGameOpen] = useState(false)

  return (
    <div
      data-testid="mobile-app-shell"
      className={`fixed inset-0 h-screen h-[100dvh] w-full bg-muted/40 flex justify-center items-center overflow-hidden sm:p-4 transition-colors ${className}`}
    >
      {/* Marco móvil PWA estandarizado con altura fija de viewport (Sin topbar) */}
      <div
        className={`w-full max-w-md h-full sm:h-[90vh] sm:max-h-[96vh] bg-background sm:rounded-3xl shadow-2xl sm:border sm:border-border/80 flex flex-col overflow-hidden relative ${containerClassName}`}
      >
        {/* 1. Ranura Modular: Banner Superior */}
        {topBannerSlot && (
          <div className="w-full shrink-0 z-40 animate-in slide-in-from-top-2">
            {topBannerSlot}
          </div>
        )}

        {/* 2. Ranura Modular: Header opcional */}
        {headerSlot && (
          <div className="w-full shrink-0 z-30">
            {headerSlot}
          </div>
        )}

        {/* 3. Ranura Modular: Sub-Header opcional */}
        {subHeaderSlot && (
          <div className="w-full shrink-0 z-20 border-b border-border/60 bg-card/60 backdrop-blur-sm">
            {subHeaderSlot}
          </div>
        )}

        {/* 4. Contenedor de Contenido Principal (Limpio, sin topbar por defecto) */}
        <main
          data-testid="mobile-app-content"
          className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain px-4 py-4 space-y-4 focus:outline-none"
        >
          {children || <Outlet />}
        </main>

        {/* 5. Ranura Modular: Encima de la barra inferior */}
        {aboveBottomSlot && (
          <div className="w-full shrink-0 z-20 px-4 pb-2">
            {aboveBottomSlot}
          </div>
        )}

        {/* 6. Ranura Modular: Barra de Navegación Inferior Estática y Fija */}
        {!hideBottomNav && (
          <div className="w-full shrink-0 z-30 mt-auto">
            {bottomSlot || (
              <BottomNavBar
                onAiClick={() => setIsAiModalOpen(true)}
                onCenterAction={() => setIsTinyGameOpen(true)}
                {...bottomNavProps}
              />
            )}
          </div>
        )}

        {/* 7. Ranura Modular: Extensión Inferior */}
        {bottomExtensionSlot && (
          <div className="w-full shrink-0 z-20">
            {bottomExtensionSlot}
          </div>
        )}

        {/* Asistente IA Modal */}
        <AiAssistantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
        />

        {/* Juego del desarrollo con Tiny (botón central +) */}
        <TinyDevelopmentGame
          isOpen={isTinyGameOpen}
          onClose={() => setIsTinyGameOpen(false)}
        />

      </div>
    </div>
  )
}
