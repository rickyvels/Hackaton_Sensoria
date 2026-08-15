import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { CaretLeft, WifiHigh, WifiSlash, ArrowsClockwise } from "@phosphor-icons/react"

import { BRAND_NAME } from "@/config/brand"

export interface TopHeaderProps {
  title?: string
  role?: string
  connectionStatus?: "online" | "offline" | "syncing"
  showBack?: boolean
  onBack?: () => void
  leftSlot?: ReactNode
  rightSlot?: ReactNode
  className?: string
}

export function TopHeader({
  title = BRAND_NAME,
  role = "Red Asistencial",
  connectionStatus = "online",
  showBack = false,
  onBack,
  leftSlot,
  rightSlot,
  className = "",
}: TopHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "offline":
        return (
          <span
            data-testid="status-badge"
            className="flex items-center gap-1 text-md font-medium text-amber-700 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full"
          >
            <WifiSlash size={13} weight="bold" />
            <span>Offline</span>
          </span>
        )
      case "syncing":
        return (
          <span
            data-testid="status-badge"
            className="flex items-center gap-1 text-md font-medium text-blue-700 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full"
          >
            <ArrowsClockwise size={13} weight="bold" className="animate-spin" />
            <span>Sincronizando</span>
          </span>
        )
      case "online":
      default:
        return (
          <span
            data-testid="status-badge"
            className="flex items-center gap-1 text-md font-medium text-emerald-700 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full"
          >
            <WifiHigh size={13} weight="bold" />
            <span>Online</span>
          </span>
        )
    }
  }

  return (
    <header
      data-testid="top-header"
      className={`sticky top-0 z-30 w-full bg-card/95 backdrop-blur-md border-b border-border/80 px-4 py-3 flex items-center justify-between shadow-sm transition-colors ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Volver atrás"
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted active:scale-95 transition-all text-foreground shrink-0 border border-border/60"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        )}

        {leftSlot}

        <div className="flex flex-col min-w-0">
          <h1 className="text-md font-bold font-heading t-tight text-foreground truncate">
            {title}
          </h1>
          {role && (
            <p className="text-md font-medium text-muted-foreground truncate">
              {role}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightSlot ? rightSlot : getStatusBadge()}
      </div>
    </header>
  )
}
