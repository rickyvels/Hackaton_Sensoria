import { useLocation, useNavigate } from "react-router-dom"
import {
  House,
  BookOpen,
  Plus,
  Path,
  User,
  Sparkle,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"

export interface NavItem {
  id: string
  label: string
  to: string
  icon: Icon
  badgeCount?: number
}

export interface BottomNavBarProps {
  items?: NavItem[]
  activeId?: string
  onTabChange?: (id: string) => void
  onCenterAction?: () => void
  onAiClick?: () => void
  showAiFab?: boolean
  showCenterButton?: boolean
  className?: string
}

export const DEFAULT_BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    to: "/app",
    icon: House,
  },
  {
    id: "recursos",
    label: "Recursos",
    to: "/app/recursos",
    icon: BookOpen,
  },
  // El botón central (+) va aquí visualmente
  {
    id: "citas",
    label: "Citas",
    to: "/app/citas",
    icon: Path,
  },
  {
    id: "perfil",
    label: "Perfil",
    to: "/app/perfil",
    icon: User,
  },
]

export function BottomNavBar({
  items = DEFAULT_BOTTOM_NAV_ITEMS,
  activeId,
  onTabChange,
  onCenterAction,
  onAiClick,
  showAiFab = true,
  showCenterButton = true,
  className = "",
}: BottomNavBarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // Determinar ítem activo basado en la URL actual si no se proporciona activeId
  const getIsActive = (item: NavItem) => {
    if (activeId) return activeId === item.id
    if (item.to === "/app" && (location.pathname === "/app" || location.pathname === "/app/")) {
      return true
    }
    return location.pathname.startsWith(item.to) && item.to !== "/app"
  }

  const handleNavClick = (item: NavItem) => {
    if (onTabChange) {
      onTabChange(item.id)
    }
    navigate(item.to)
  }

  const handleCenterClick = () => {
    if (onCenterAction) {
      onCenterAction()
    } else {
      navigate("/app/mi-hijo")
    }
  }

  // Dividir los ítems: primeros 2 a la izquierda, restantes a la derecha para rodear el botón central (+)
  const leftItems = items.slice(0, 2)
  const rightItems = items.slice(2)

  return (
    <div className={`sticky bottom-0 z-30 w-full ${className}`}>
      {/* Botón Flotante de IA (Outline blanco/contraste limpio con token semántico) */}
      {showAiFab && (
        <div className="absolute -top-18 right-4 z-40 pointer-events-auto">
          <button
            type="button"
            onClick={onAiClick || (() => navigate("/app/demo"))}
            aria-label="Asistente de Inteligencia Artificial"
            className="flex items-center justify-center w-15 h-15 rounded-full bg-foreground text-background shadow-md hover:opacity-90 active:scale-95 transition-transform duration-150 border border-border"
          >
            <Sparkle
              size={26}
              weight="regular"
              className="text-background"
            />
          </button>
        </div>
      )}

      {/* Barra de Navegación Inferior Estática con Glassmorphism Sutil */}
      <nav
        data-testid="bottom-nav-bar"
        aria-label="Navegación principal de la aplicación"
        className="w-full bg-card/75 backdrop-blur-xl border-t border-border/50 px-2 py-1 shadow-lg"
      >
        <div className="flex items-center justify-between max-w-md mx-auto relative h-16">
          {/* Bloque Izquierdo: Home y Recursos */}
          <div className="flex items-center justify-around flex-1">
            {leftItems.map((item) => {
              const active = getIsActive(item)
              const IconComponent = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center w-16 h-14 bg-transparent transition-colors duration-150 active:scale-95 ${active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <IconComponent
                    size={28}
                    weight={active ? "fill" : "regular"}
                    className="transition-colors duration-150"
                  />
                  <span
                    className={`text-sm trk_tight mt-0.5 ${active ? "font-bold text-primary" : "font-medium text-muted-foreground"
                      }`}
                  >
                    {item.label}
                  </span>
                  {Boolean(item.badgeCount && item.badgeCount > 0) && (
                    <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center ring-2 ring-card">
                      {item.badgeCount! > 99 ? "99+" : item.badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Botón Central (+) Elevado */}
          {showCenterButton && (
            <div className="relative -top-4 flex items-center justify-center px-2">
              <button
                type="button"
                data-testid="nav-center-action"
                onClick={handleCenterClick}
                aria-label="Ver o editar la información de mi hijo"
                className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-transform duration-150 ring-4 ring-background border border-primary-foreground/20"
              >
                <Plus
                  size={30}
                  weight="bold"
                />
              </button>
            </div>
          )}

          {/* Bloque Derecho: Seguimiento de Citas y Perfil */}
          <div className="flex items-center justify-around flex-1">
            {rightItems.map((item) => {
              const active = getIsActive(item)
              const IconComponent = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center w-16 h-14 bg-transparent transition-colors duration-150 active:scale-95 ${active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <IconComponent
                    size={28}
                    weight={active ? "fill" : "regular"}
                    className="transition-colors duration-150"
                  />
                  <span
                    className={`text-sm trk_tight mt-0.5 leading-none text-center ${active ? "font-bold text-primary" : "font-medium text-muted-foreground"
                      }`}
                  >
                    {item.label}
                  </span>
                  {Boolean(item.badgeCount && item.badgeCount > 0) && (
                    <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center ring-2 ring-card">
                      {item.badgeCount! > 99 ? "99+" : item.badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
