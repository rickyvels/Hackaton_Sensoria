import { useMemo, useState } from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Check, Hospital, Sparkles, X } from "lucide-react"

import { CRED_HIGH_RISK_SIGNS, type CredStage, CRED_STAGES } from "@/data/credDevelopment"
import { useOptionalCase } from "@/context/CaseContext"
import { useOptionalTinyProgress } from "@/context/TinyProgressContext"
import {
  COINS_ON_COMPLETION,
  COINS_PER_ANSWER,
  SEMAFORO_COPY,
  buildDeck,
  evaluateDeck,
  findStageForAge,
  getHomeActivities,
  type SemaforoLevel,
  type TinyDeck,
} from "@/services/tinyScreening"
import { TinyCoinsBadge } from "@/components/tiny/TinyCoinsBadge"
import { TinyMascot, TinySpeechBubble } from "@/components/tiny/TinyMascot"
import { playTinySound } from "@/components/tiny/tinySound"
import { useOptionalLanguage } from "@/i18n/LanguageContext"

export interface TinyDevelopmentGameProps {
  isOpen: boolean
  onClose: () => void
}

type GameScreen = "intro" | "edad" | "listo" | "juego" | "resultado"

const SEMAFORO_DOT_CLASS: Record<SemaforoLevel, string> = {
  verde: "bg-semaforo-verde",
  amarillo: "bg-semaforo-amarillo",
  rojo: "bg-semaforo-rojo",
}

const SEMAFORO_ACCENT_CLASS: Record<SemaforoLevel, string> = {
  verde: "border-semaforo-verde/40 bg-semaforo-verde/10",
  amarillo: "border-semaforo-amarillo/40 bg-semaforo-amarillo/10",
  rojo: "border-semaforo-rojo/40 bg-semaforo-rojo/10",
}

const SEMAFORO_TEXT_CLASS: Record<SemaforoLevel, string> = {
  verde: "text-semaforo-verde",
  amarillo: "text-semaforo-amarillo",
  rojo: "text-semaforo-rojo",
}

/** Botón grande con relieve inferior, al estilo de los juegos de aprendizaje. */
function ChunkyButton({
  children,
  onClick,
  tone = "primary",
  className = "",
  ...rest
}: {
  children: ReactNode
  onClick: () => void
  tone?: "primary" | "neutral" | "danger"
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children" | "className">) {
  const toneClass = {
    primary:
      "border-b-4 border-primary/60 bg-primary text-primary-foreground hover:bg-primary/90",
    neutral:
      "border-b-4 border-border bg-card text-foreground hover:bg-muted",
    danger:
      "border-b-4 border-semaforo-rojo/50 bg-card text-semaforo-rojo hover:bg-semaforo-rojo/10",
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-12 rounded-2xl px-4 py-3 text-base font-bold transition-all active:translate-y-1 active:border-b-0 ${toneClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

function SemaforoLights({ level }: { level: SemaforoLevel }) {
  return (
    <div
      data-testid="semaforo-lights"
      data-level={level}
      aria-label={`Semáforo del desarrollo: ${level}`}
      className="flex items-center gap-1 rounded-full bg-foreground/85 px-2 py-1.5"
    >
      {(["rojo", "amarillo", "verde"] as const).map((light) => (
        <span
          key={light}
          className={`size-2.5 rounded-full transition-colors ${
            level === light ? SEMAFORO_DOT_CLASS[light] : "bg-background/30"
          }`}
        />
      ))}
    </div>
  )
}

export function TinyDevelopmentGame({ isOpen, onClose }: TinyDevelopmentGameProps) {
  // La sesión se monta solo mientras el juego está abierto. Así cada partida
  // empieza limpia sin necesidad de reiniciar el estado a mano: un tamizaje
  // nunca debe arrastrar las respuestas del anterior.
  if (!isOpen) {
    return null
  }

  return <TinyGameSession onClose={onClose} />
}

function TinyGameSession({ onClose }: { onClose: () => void }) {
  const caseContext = useOptionalCase()
  const tinyProgress = useOptionalTinyProgress()
  const { t, isTranslated } = useOptionalLanguage()

  const [screen, setScreen] = useState<GameScreen>("intro")
  const [stage, setStage] = useState<CredStage | null>(null)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [cardIndex, setCardIndex] = useState(0)

  const suggestedStage = caseContext?.activePatient
    ? findStageForAge(caseContext.activePatient.ageMonths)
    : null

  const deck: TinyDeck | null = useMemo(() => (stage ? buildDeck(stage) : null), [stage])

  const liveResult = useMemo(
    () => (deck ? evaluateDeck(deck, answers) : null),
    [deck, answers],
  )

  const currentCard = deck?.cards[cardIndex] ?? null
  const totalCards = deck?.cards.length ?? 0
  const progressPercent = totalCards > 0 ? Math.round((cardIndex / totalCards) * 100) : 0
  const liveLevel = liveResult?.level ?? "verde"

  const handleSelectStage = (selected: CredStage) => {
    playTinySound("tap")
    setStage(selected)
    setAnswers({})
    setCardIndex(0)
    setScreen("listo")
  }

  const handleAnswer = (isAffirmative: boolean) => {
    if (!deck || !currentCard) {
      return
    }

    const nextAnswers = { ...answers, [currentCard.id]: isAffirmative }
    setAnswers(nextAnswers)
    tinyProgress?.addCoins(COINS_PER_ANSWER)

    const isLastCard = cardIndex + 1 >= deck.cards.length
    if (!isLastCard) {
      playTinySound("coin")
      setCardIndex(cardIndex + 1)
      return
    }

    const finalResult = evaluateDeck(deck, nextAnswers)
    tinyProgress?.addCoins(COINS_ON_COMPLETION)
    tinyProgress?.registerRun({
      ageMonths: deck.stage.ageMonths,
      label: deck.stage.label,
      level: finalResult.level,
      missedMilestones: finalResult.missedMilestones.length,
      activeAlerts: finalResult.activeAlerts.length,
      coinsEarned: finalResult.coinsEarned,
      completedAt: new Date().toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    })
    playTinySound(finalResult.level === "rojo" ? "alert" : "win")
    setScreen("resultado")
  }

  const handleRestart = () => {
    playTinySound("tap")
    setStage(null)
    setAnswers({})
    setCardIndex(0)
    setScreen("edad")
  }

  return (
    <div
      data-testid="tiny-game"
      role="dialog"
      aria-modal="true"
      aria-label="Juego del desarrollo con Tiny"
      className="absolute inset-0 z-50 flex flex-col bg-background"
    >
      {/* Barra superior: salir, progreso, semáforo en vivo y NeuroCoins */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("tinyCloseGame")}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {screen === "juego" ? (
          <>
            <div
              className="h-4 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("tinyProgressLabel")}
            >
              <div
                data-testid="tiny-progress-fill"
                className="h-full rounded-full bg-semaforo-verde transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <SemaforoLights level={liveLevel} />
          </>
        ) : (
          <p className="flex-1 truncate text-base font-semibold text-foreground">
            {t("tinyGameTitle")}
          </p>
        )}

        <TinyCoinsBadge coins={tinyProgress?.neuroCoins ?? 0} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
        {/* El contenido clínico se cita literalmente de la Libreta CRED y no se
            traduce automáticamente: una señal de alarma mal traducida puede
            hacer que una familia no consulte a tiempo. */}
        {isTranslated && (
          <p className="mb-4 rounded-xl bg-muted p-3 text-sm leading-relaxed text-muted-foreground">
            {t("clinicalSpanishNotice")}
          </p>
        )}

        {screen === "intro" && (
          <IntroScreen onContinue={() => { playTinySound("tap"); setScreen("edad") }} />
        )}

        {screen === "edad" && (
          <AgeScreen suggestedStage={suggestedStage} onSelect={handleSelectStage} />
        )}

        {screen === "listo" && stage && deck && (
          <ReadyScreen
            stage={stage}
            cardCount={deck.cards.length}
            onContinue={() => { playTinySound("tap"); setScreen("juego") }}
          />
        )}

        {screen === "juego" && currentCard && deck && (
          <QuestionScreen
            key={currentCard.id}
            areaLabel={currentCard.areaLabel}
            kind={currentCard.kind}
            question={currentCard.question}
            position={cardIndex + 1}
            total={totalCards}
            onAnswer={handleAnswer}
          />
        )}

        {screen === "resultado" && deck && liveResult && (
          <ResultScreen
            deck={deck}
            level={liveResult.level}
            missedMilestones={liveResult.missedMilestones.map((card) => card.sourceText)}
            activeAlerts={liveResult.activeAlerts.map((card) => card.sourceText)}
            coinsEarned={liveResult.coinsEarned}
            onRestart={handleRestart}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

function IntroScreen({ onContinue }: { onContinue: () => void }) {
  const { t } = useOptionalLanguage()

  return (
    <div className="flex h-full flex-col items-center justify-between gap-6 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <TinySpeechBubble className="tiny-pop">{t("tinyHello")}</TinySpeechBubble>
        <TinyMascot
          mood="saluda"
          className="tiny-idle w-48 sm:w-56"
          label="Tiny, la mascota de Tinkuy, saludando"
        />
        <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
          {t("tinyIntro")}
        </p>
      </div>

      <ChunkyButton onClick={onContinue}>{t("continue")}</ChunkyButton>
    </div>
  )
}

function AgeScreen({
  suggestedStage,
  onSelect,
}: {
  suggestedStage: CredStage | null
  onSelect: (stage: CredStage) => void
}) {
  const { t } = useOptionalLanguage()

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">{t("tinyAgeQuestion")}</h2>
        <p className="text-base text-muted-foreground">{t("tinyAgeHelp")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CRED_STAGES.map((stage) => {
          const isSuggested = suggestedStage?.id === stage.id

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelect(stage)}
              className={`flex min-h-28 flex-col items-start justify-between gap-2 rounded-2xl border-2 border-b-4 p-4 text-left transition-all active:translate-y-0.5 ${
                isSuggested
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-lg font-bold text-foreground">{stage.shortLabel}</span>
              <span className="text-sm leading-snug text-muted-foreground">{stage.helper}</span>
              {isSuggested && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                  <Check className="size-3.5" aria-hidden="true" />
                  {t("tinyTheirAge")}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ReadyScreen({
  stage,
  cardCount,
  onContinue,
}: {
  stage: CredStage
  cardCount: number
  onContinue: () => void
}) {
  const { t } = useOptionalLanguage()

  return (
    <div className="flex h-full flex-col items-center justify-between gap-6 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <TinySpeechBubble className="tiny-pop">{t("tinyReady")}</TinySpeechBubble>
        <TinyMascot mood="anima" className="tiny-idle w-48 sm:w-56" label="Tiny celebrando" />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">{stage.label}</p>
          <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
            Son {cardCount} preguntas cortas. Responde con lo que ves en casa, sin apuro. No hay
            respuestas buenas ni malas.
          </p>
        </div>
      </div>

      <ChunkyButton onClick={onContinue}>{t("tinyStart")}</ChunkyButton>
    </div>
  )
}

function QuestionScreen({
  areaLabel,
  kind,
  question,
  position,
  total,
  onAnswer,
}: {
  areaLabel: string
  kind: "hito" | "alerta"
  question: string
  position: number
  total: number
  onAnswer: (isAffirmative: boolean) => void
}) {
  const { t } = useOptionalLanguage()
  const isAlert = kind === "alerta"

  return (
    <div className="tiny-pop flex h-full flex-col justify-between gap-6">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${
              isAlert
                ? "bg-semaforo-rojo/10 text-semaforo-rojo"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isAlert ? t("tinyAlertBadge") : areaLabel}
          </span>
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {position} {t("tinyOf")} {total}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <TinyMascot
            mood="pregunta"
            className="w-20 shrink-0"
            label="Tiny acompañando la pregunta"
          />
          <p className="pt-2 text-2xl font-bold leading-snug text-foreground">{question}</p>
        </div>
      </div>

      <div className="space-y-3">
        {isAlert ? (
          <>
            <ChunkyButton tone="danger" onClick={() => onAnswer(true)}>
              {t("tinyAlertYes")}
            </ChunkyButton>
            <ChunkyButton tone="primary" onClick={() => onAnswer(false)}>
              {t("tinyAlertNo")}
            </ChunkyButton>
          </>
        ) : (
          <>
            <ChunkyButton tone="primary" onClick={() => onAnswer(true)}>
              {t("tinyYes")}
            </ChunkyButton>
            <ChunkyButton tone="neutral" onClick={() => onAnswer(false)}>
              {t("tinyNotYet")}
            </ChunkyButton>
          </>
        )}
        <p className="text-center text-sm text-muted-foreground">
          Cada respuesta suma {COINS_PER_ANSWER} NeuroCoins, respondas lo que respondas.
        </p>
      </div>
    </div>
  )
}

function ResultScreen({
  deck,
  level,
  missedMilestones,
  activeAlerts,
  coinsEarned,
  onRestart,
  onClose,
}: {
  deck: TinyDeck
  level: SemaforoLevel
  missedMilestones: string[]
  activeAlerts: string[]
  coinsEarned: number
  onRestart: () => void
  onClose: () => void
}) {
  const copy = SEMAFORO_COPY[level]
  const isRed = level === "rojo"

  return (
    <div className="space-y-5 pb-2" data-testid="tiny-result" data-level={level}>
      <div className="flex flex-col items-center gap-3 text-center">
        <TinyMascot
          mood={isRed ? "acompana" : "anima"}
          className="w-36"
          label="Tiny con el resultado"
        />
        <p className="text-base font-medium text-muted-foreground">{copy.celebration}</p>
        <h2 className={`text-2xl font-bold leading-tight ${SEMAFORO_TEXT_CLASS[level]}`}>
          {copy.title}
        </h2>
      </div>

      <div className={`space-y-3 rounded-2xl border-2 p-4 ${SEMAFORO_ACCENT_CLASS[level]}`}>
        <div className="flex items-center gap-2">
          <span className={`size-3.5 rounded-full ${SEMAFORO_DOT_CLASS[level]}`} aria-hidden="true" />
          <span className="text-base font-bold uppercase tracking-wide text-foreground">
            Semáforo {level}
          </span>
        </div>
        <p className="text-base leading-relaxed text-foreground">«{copy.message}»</p>
        <p className="text-sm text-muted-foreground">
          Tamizaje del desarrollo · Libreta CRED, MINSA
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-neurocoin/30 bg-neurocoin/10 p-4">
        <Sparkles className="size-5 shrink-0 text-neurocoin" aria-hidden="true" />
        <p className="text-base font-medium text-foreground">
          Ganaste <span className="font-bold">{coinsEarned} NeuroCoins</span> por acompañar su
          desarrollo hoy.
        </p>
      </div>

      {activeAlerts.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Señales que marcaste</h3>
          <ul className="space-y-2">
            {activeAlerts.map((sign) => (
              <li
                key={sign}
                className="rounded-xl border border-semaforo-rojo/30 bg-semaforo-rojo/5 p-3 text-base leading-snug text-foreground"
              >
                {sign}
              </li>
            ))}
          </ul>
        </section>
      )}

      {missedMilestones.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Habilidades por reforzar</h3>
          <ul className="space-y-2">
            {missedMilestones.map((skill) => (
              <li
                key={skill}
                className="rounded-xl border border-semaforo-amarillo/30 bg-semaforo-amarillo/5 p-3 text-base leading-snug text-foreground"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-lg font-bold text-foreground">Qué hacer ahora</h3>
        <p className="rounded-xl bg-muted p-3 text-base leading-relaxed text-foreground">
          {copy.nextStep}
        </p>
      </section>

      {isRed ? (
        <section className="space-y-2">
          <h3 className="text-lg font-bold text-semaforo-rojo">Llévalo de inmediato si:</h3>
          <ul className="list-inside list-disc space-y-1 rounded-xl border border-semaforo-rojo/30 bg-semaforo-rojo/5 p-3 text-base leading-relaxed text-foreground">
            {CRED_HIGH_RISK_SIGNS.slice(0, 5).map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">Señales de alto riesgo · Libreta CRED, MINSA</p>
        </section>
      ) : (
        <section className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Para jugar en casa</h3>
          <ul className="space-y-2">
            {getHomeActivities().map((activity) => (
              <li
                key={activity}
                className="rounded-xl border border-border bg-card p-3 text-base leading-snug text-foreground"
              >
                {activity}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">Promoviendo mi desarrollo · Libreta CRED, MINSA</p>
        </section>
      )}

      <div className="space-y-3 pt-1">
        {isRed && (
          <Link
            to="/app/citas"
            onClick={onClose}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-primary/60 bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-all active:translate-y-1 active:border-b-0"
          >
            <Hospital className="size-5" aria-hidden="true" />
            Coordinar atención
          </Link>
        )}
        <Link
          to="/app/recursos"
          onClick={onClose}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-border bg-card px-4 py-3 text-base font-bold text-foreground transition-all hover:bg-muted active:translate-y-1 active:border-b-0"
        >
          Ver recursos para {deck.stage.shortLabel}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
        <ChunkyButton tone="neutral" onClick={onRestart}>
          Jugar con otra edad
        </ChunkyButton>
      </div>

      <p className="pb-2 text-center text-sm leading-relaxed text-muted-foreground">
        Este juego es una vigilancia orientativa basada en la Libreta CRED del MINSA. No reemplaza la
        evaluación de un profesional de salud ni genera un diagnóstico.
      </p>
    </div>
  )
}
