/**
 * Tiny — mascota de Tinkuy. Ilustración vectorial propia de una bulldog
 * francesa, dibujada con los tokens del sistema de diseño para que funcione en
 * modo claro y oscuro sin cargar imágenes externas (requisito PWA offline).
 */

import type { ReactNode } from "react"

export type TinyMood = "saluda" | "anima" | "pregunta" | "acompana"

export interface TinyMascotProps {
  mood?: TinyMood
  /** Ancho del dibujo en unidades de Tailwind (por defecto w-48). */
  className?: string
  /** Texto alternativo; si se omite se marca como decorativa. */
  label?: string
}

/** Posición de la patita levantada según el ánimo. */
const PAW_TRANSFORM: Record<TinyMood, string> = {
  saluda: "rotate(-14 150 118)",
  anima: "rotate(-30 150 118)",
  pregunta: "rotate(4 150 118)",
  acompana: "rotate(-6 150 118)",
}

export function TinyMascot({ mood = "saluda", className = "w-48", label }: TinyMascotProps) {
  const isCheering = mood === "anima"

  return (
    <svg
      viewBox="0 0 220 220"
      className={`${className} h-auto`}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-testid="tiny-mascot"
      data-mood={mood}
    >
      <g
        className="fill-tiny-fur stroke-tiny-ink"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Colchoneta de juego */}
        <path
          d="M 52 196 L 168 196 L 186 180 L 70 180 Z"
          className="fill-tiny-mat stroke-tiny-ink"
        />

        {/* Orejas de murciélago */}
        <path d="M 80 50 C 71 33, 67 18, 74 14 C 81 11, 93 27, 99 41 C 92 43, 85 46, 80 50 Z" />
        <path d="M 140 50 C 149 33, 153 18, 146 14 C 139 11, 127 27, 121 41 C 128 43, 135 46, 140 50 Z" />
        <path
          d="M 84 46 C 78 34, 76 24, 79 22 C 83 21, 90 31, 94 40 Z"
          className="fill-tiny-fur-shade stroke-tiny-ink"
          strokeWidth="2.5"
        />
        <path
          d="M 136 46 C 142 34, 144 24, 141 22 C 137 21, 130 31, 126 40 Z"
          className="fill-tiny-fur-shade stroke-tiny-ink"
          strokeWidth="2.5"
        />

        {/* Cuerpo sentado */}
        <path d="M 110 80 C 146 80, 163 110, 161 142 C 159 170, 138 184, 110 184 C 82 184, 61 170, 59 142 C 57 110, 74 80, 110 80 Z" />

        {/* Patitas traseras */}
        <ellipse cx="82" cy="176" rx="17" ry="11" />
        <ellipse cx="138" cy="176" rx="17" ry="11" />

        {/* Patita apoyada */}
        <path
          d="M 72 122 C 62 118, 54 126, 57 136 C 60 145, 72 146, 78 139 Z"
          transform={isCheering ? "rotate(18 72 130)" : undefined}
        />

        {/* Patita levantada que saluda */}
        <g transform={PAW_TRANSFORM[mood]}>
          <path d="M 148 124 C 158 114, 170 116, 172 127 C 174 138, 163 145, 154 140 Z" />
          <path
            d="M 160 122 L 160 128 M 167 124 L 165 130"
            fill="none"
            strokeWidth="2.5"
            className="stroke-tiny-ink"
          />
        </g>

        {/* Cabeza */}
        <path d="M 110 32 C 135 32, 154 50, 154 73 C 154 96, 135 112, 110 112 C 85 112, 66 96, 66 73 C 66 50, 85 32, 110 32 Z" />

        {/* Hocico */}
        <ellipse cx="110" cy="88" rx="25" ry="17" className="fill-tiny-fur stroke-tiny-ink" />

        {/* Nariz */}
        <path
          d="M 110 71 C 117 71, 122 75, 122 80 C 122 85, 116 88, 110 88 C 104 88, 98 85, 98 80 C 98 75, 103 71, 110 71 Z"
          className="fill-tiny-snout stroke-tiny-ink"
        />
      </g>

      {/* Rasgos faciales: siempre en tinta, sin relleno */}
      <g
        className="stroke-tiny-ink"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ojos cerraditos de felicidad */}
        <path d="M 82 66 C 86 58, 95 58, 99 66" />
        <path d="M 121 66 C 125 58, 134 58, 138 66" />

        {/* Boca */}
        {mood === "pregunta" ? (
          <path d="M 100 96 C 105 101, 115 101, 120 96" />
        ) : (
          <>
            <path d="M 110 88 L 110 94" />
            <path
              d="M 95 94 C 99 106, 121 106, 125 94 Z"
              className="fill-tiny-snout stroke-tiny-ink"
            />
          </>
        )}

        {/* Pliegue característico de la raza */}
        <path d="M 96 76 C 100 79, 100 83, 97 85" strokeWidth="2.5" />
        <path d="M 124 76 C 120 79, 120 83, 123 85" strokeWidth="2.5" />
      </g>

      {/* Chispas de celebración */}
      {isCheering && (
        <g className="fill-neurocoin" aria-hidden="true">
          <path d="M 40 60 L 44 70 L 54 74 L 44 78 L 40 88 L 36 78 L 26 74 L 36 70 Z" />
          <path d="M 182 92 L 185 100 L 193 103 L 185 106 L 182 114 L 179 106 L 171 103 L 179 100 Z" />
        </g>
      )}
    </svg>
  )
}

export interface TinySpeechBubbleProps {
  children: ReactNode
  className?: string
}

/** Globo de diálogo de Tiny, con la colita apuntando hacia la mascota. */
export function TinySpeechBubble({ children, className = "" }: TinySpeechBubbleProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      <div className="rounded-2xl border-2 border-border bg-card px-5 py-3 text-lg font-semibold text-foreground shadow-sm">
        {children}
      </div>
      <svg
        viewBox="0 0 24 16"
        className="absolute left-1/2 top-full h-4 w-6 -translate-x-1/2"
        aria-hidden="true"
      >
        <path d="M 2 0 L 22 0 L 10 15 Z" className="fill-card stroke-border" strokeWidth="2" />
        <path d="M 2 0 L 10 15 L 22 0" className="stroke-border" fill="none" strokeWidth="2" />
      </svg>
    </div>
  )
}
