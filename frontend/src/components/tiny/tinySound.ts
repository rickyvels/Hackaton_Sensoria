/**
 * Sonidos del juego de Tiny sintetizados con la Web Audio API.
 *
 * La libreta se usa en postas con conexión intermitente, así que el juego no
 * descarga archivos de audio: genera tonos cortos en el navegador. Si el
 * entorno no expone AudioContext (SSR o pruebas), las llamadas no hacen nada.
 */

export type TinySoundName = "tap" | "coin" | "win" | "alert"

interface ToneStep {
  frequency: number
  durationMs: number
  type?: OscillatorType
}

const SOUND_STEPS: Record<TinySoundName, ToneStep[]> = {
  tap: [{ frequency: 520, durationMs: 70 }],
  coin: [
    { frequency: 880, durationMs: 70 },
    { frequency: 1320, durationMs: 110 },
  ],
  win: [
    { frequency: 660, durationMs: 110 },
    { frequency: 880, durationMs: 110 },
    { frequency: 1175, durationMs: 200 },
  ],
  alert: [
    { frequency: 380, durationMs: 160, type: "triangle" },
    { frequency: 300, durationMs: 240, type: "triangle" },
  ],
}

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextConstructor) {
    return null
  }

  audioContext ??= new AudioContextConstructor()
  return audioContext
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/** Reproduce un efecto corto. Nunca lanza: el audio es un extra, no un requisito. */
export function playTinySound(name: TinySoundName) {
  if (prefersReducedMotion()) {
    return
  }

  try {
    const context = getAudioContext()
    if (!context) {
      return
    }
    if (context.state === "suspended") {
      void context.resume()
    }

    let startTime = context.currentTime
    for (const step of SOUND_STEPS[name]) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const durationSeconds = step.durationMs / 1000

      oscillator.type = step.type ?? "sine"
      oscillator.frequency.setValueAtTime(step.frequency, startTime)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSeconds)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + durationSeconds)

      startTime += durationSeconds
    }
  } catch {
    // Sin audio disponible el juego sigue funcionando igual.
  }
}
