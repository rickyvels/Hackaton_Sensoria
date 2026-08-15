import { useEffect, useRef, useState } from "react"

export interface TinyCoinsBadgeProps {
  coins: number
  /** `contrast` se usa sobre fondos oscuros o con imagen (hero del inicio). */
  variant?: "default" | "contrast"
  className?: string
}

/** Moneda de NeuroCoins dibujada con tokens, sin depender de assets externos. */
export function NeuroCoinIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" className="fill-neurocoin-shade" />
      <circle cx="12" cy="11" r="8.5" className="fill-neurocoin" />
      <path
        d="M 12 6.5 C 9.5 6.5, 8 8.2, 8 10.2 C 8 12.6, 10 13.4, 12 15.5 C 14 13.4, 16 12.6, 16 10.2 C 16 8.2, 14.5 6.5, 12 6.5 Z"
        className="fill-neurocoin-shade"
      />
    </svg>
  )
}

export function TinyCoinsBadge({ coins, variant = "default", className = "" }: TinyCoinsBadgeProps) {
  const [isPulsing, setIsPulsing] = useState(false)
  const previousCoins = useRef(coins)

  useEffect(() => {
    if (coins > previousCoins.current) {
      setIsPulsing(true)
      const timeout = window.setTimeout(() => setIsPulsing(false), 500)
      previousCoins.current = coins
      return () => window.clearTimeout(timeout)
    }
    previousCoins.current = coins
  }, [coins])

  const containerClass =
    variant === "contrast"
      ? "border-white/25 bg-white/20 text-white backdrop-blur-md"
      : "border-neurocoin/30 bg-neurocoin/10 text-foreground"

  return (
    <span
      data-testid="neurocoins-badge"
      aria-label={`${coins} NeuroCoins acumuladas`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${containerClass} ${className}`}
    >
      <NeuroCoinIcon className={`size-5 shrink-0 ${isPulsing ? "coin-pulse" : ""}`} />
      <span className="text-base font-bold tabular-nums">{coins}</span>
      <span className="sr-only">NeuroCoins</span>
    </span>
  )
}
