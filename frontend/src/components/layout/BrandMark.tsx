import { BRAND_NAME, BRAND_NAME_PARTS, LOGO_SRC } from "@/config/brand"

export interface BrandMarkProps {
  /** `light` para fondos oscuros o con imagen (hero); `default` para el resto. */
  variant?: "default" | "light"
  /** Oculta el nombre y deja solo el símbolo. */
  symbolOnly?: boolean
  className?: string
}

/**
 * Símbolo provisional: dos siluetas que se encuentran, en la línea del
 * logotipo de Tinkuy. Se reemplaza automáticamente en cuanto `LOGO_SRC`
 * apunte al archivo oficial en `src/config/brand.ts`.
 */
function TinkuySymbol({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M 8 27 C 5 21, 8 13, 15 13 C 20 13, 22 17, 22 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 32 27 C 35 22, 33 16, 27 16 C 23 16, 21 19, 21 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="15" cy="9" r="3.5" fill="currentColor" />
      <circle cx="27" cy="12" r="2.8" fill="currentColor" opacity="0.65" />
    </svg>
  )
}

export function BrandMark({
  variant = "default",
  symbolOnly = false,
  className = "",
}: BrandMarkProps) {
  const isLight = variant === "light"

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
          isLight
            ? "border border-white/20 bg-white/15 text-white"
            : "bg-primary/10 text-primary"
        }`}
      >
        {LOGO_SRC ? (
          <img src={LOGO_SRC} alt="" className="size-full object-contain" />
        ) : (
          <TinkuySymbol className="size-6" />
        )}
      </span>

      {/* El nombre accesible se declara una sola vez: visible cuando hay espacio,
          y solo entonces oculto para lectores de pantalla. */}
      {symbolOnly ? (
        <span className="sr-only">{BRAND_NAME}</span>
      ) : (
        <span
          className={`truncate text-lg font-normal ${isLight ? "text-white" : "text-foreground"}`}
        >
          {BRAND_NAME_PARTS.lead}
          <span className={isLight ? "font-semibold text-white/90" : "font-semibold"}>
            {BRAND_NAME_PARTS.accent}
          </span>
        </span>
      )}
    </span>
  )
}
