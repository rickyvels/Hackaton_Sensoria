/**
 * Motor del juego de vigilancia del desarrollo de Tiny.
 *
 * Funciones puras sobre los datos de la libreta CRED del MINSA. No conoce
 * React ni el DOM: la interfaz solo consume el mazo de preguntas y el
 * resultado del semáforo.
 */

import {
  ALERT_AREA_LABELS,
  CRED_ALERT_SIGNS,
  CRED_HOME_ACTIVITIES,
  CRED_MILESTONES,
  CRED_STAGES,
  DEVELOPMENT_AREA_LABELS,
  type CredAlertSign,
  type CredMilestone,
  type CredStage,
} from "@/data/credDevelopment"

/** Semáforo del "Tamizaje del desarrollo" de la libreta CRED. */
export type SemaforoLevel = "verde" | "amarillo" | "rojo"

export type TinyCardKind = "hito" | "alerta"

export interface TinyCard {
  id: string
  kind: TinyCardKind
  /** Etiqueta del área mostrada como encabezado de la tarjeta. */
  areaLabel: string
  question: string
  /** Texto literal de la libreta, para trazabilidad en el resultado. */
  sourceText: string
}

export interface TinyDeck {
  stage: CredStage
  /** Columna de hitos usada, que puede ser menor a la edad elegida. */
  milestoneAgeMonths: number
  /** Columna de señales de alerta usada ("la edad menor más cercana"). */
  alertAgeMonths: number
  cards: TinyCard[]
}

export interface TinyScreeningResult {
  level: SemaforoLevel
  /** Hitos que la familia respondió "aún no". */
  missedMilestones: TinyCard[]
  /** Señales de alerta que la familia confirmó haber observado. */
  activeAlerts: TinyCard[]
  answeredCount: number
  totalCount: number
  coinsEarned: number
}

/** NeuroCoins otorgadas por cada respuesta registrada. */
export const COINS_PER_ANSWER = 5
/** NeuroCoins extra al terminar el recorrido completo. */
export const COINS_ON_COMPLETION = 25

/**
 * Las monedas premian el registro honesto, no el resultado: responder "aún no"
 * otorga lo mismo que responder "sí lo hace". Premiar las respuestas positivas
 * incentivaría ocultar señales en un tamizaje de salud.
 */
export function calculateCoins(answeredCount: number, isCompleted: boolean): number {
  return answeredCount * COINS_PER_ANSWER + (isCompleted ? COINS_ON_COMPLETION : 0)
}

/** Devuelve la etapa CRED cuya edad es la mayor que no supera `ageMonths`. */
export function findStageForAge(ageMonths: number): CredStage {
  const eligible = CRED_STAGES.filter((stage) => stage.ageMonths <= ageMonths)
  return eligible.at(-1) ?? CRED_STAGES[0]
}

function findNearestLowerAge(ages: number[], ageMonths: number): number {
  const eligible = ages.filter((age) => age <= ageMonths).sort((first, second) => first - second)
  return eligible.at(-1) ?? Math.min(...ages)
}

/**
 * Hitos esperados a una edad. La tabla "Vigilancia del desarrollo" termina en
 * los 30 meses, así que para edades mayores se usa la última columna
 * documentada: son habilidades que a esa edad ya deberían estar logradas.
 */
export function getMilestonesForAge(ageMonths: number): {
  milestones: CredMilestone[]
  columnAgeMonths: number
} {
  const documentedAges = [...new Set(CRED_MILESTONES.map((milestone) => milestone.ageMonths))]
  const columnAgeMonths = findNearestLowerAge(documentedAges, ageMonths)
  return {
    milestones: CRED_MILESTONES.filter((milestone) => milestone.ageMonths === columnAgeMonths),
    columnAgeMonths,
  }
}

/**
 * Señales de alerta de una edad. La libreta indica: "Busca mi edad en la parte
 * de arriba o la edad menor más cercana a la mía". Las señales marcadas como
 * "cualquier edad" (`ageMonths === 0`) se añaden siempre.
 */
export function getAlertSignsForAge(ageMonths: number): {
  ageSpecific: CredAlertSign[]
  anyAge: CredAlertSign[]
  columnAgeMonths: number
} {
  const anyAge = CRED_ALERT_SIGNS.filter((sign) => sign.ageMonths === 0)
  const documentedAges = [
    ...new Set(CRED_ALERT_SIGNS.filter((sign) => sign.ageMonths > 0).map((sign) => sign.ageMonths)),
  ]
  const columnAgeMonths = findNearestLowerAge(documentedAges, ageMonths)
  return {
    ageSpecific: CRED_ALERT_SIGNS.filter((sign) => sign.ageMonths === columnAgeMonths),
    anyAge,
    columnAgeMonths,
  }
}

/** Número máximo de señales de alerta específicas de la edad por partida. */
const MAX_AGE_SPECIFIC_ALERTS = 4
/** Número máximo de señales de "cualquier edad" por partida. */
const MAX_ANY_AGE_ALERTS = 3

/**
 * Arma el mazo de una partida: primero los hitos de la edad (positivos, para
 * empezar reconociendo logros) y después las señales de alerta.
 */
export function buildDeck(stage: CredStage): TinyDeck {
  const { milestones, columnAgeMonths: milestoneAgeMonths } = getMilestonesForAge(stage.ageMonths)
  const { ageSpecific, anyAge, columnAgeMonths: alertAgeMonths } = getAlertSignsForAge(
    stage.ageMonths,
  )

  const milestoneCards: TinyCard[] = milestones.map((milestone) => ({
    id: milestone.id,
    kind: "hito",
    areaLabel: DEVELOPMENT_AREA_LABELS[milestone.area],
    question: milestone.question,
    sourceText: milestone.skill,
  }))

  const alertCards: TinyCard[] = [
    ...ageSpecific.slice(0, MAX_AGE_SPECIFIC_ALERTS),
    ...anyAge.slice(0, MAX_ANY_AGE_ALERTS),
  ].map((sign) => ({
    id: sign.id,
    kind: "alerta",
    areaLabel: ALERT_AREA_LABELS[sign.area],
    question: sign.question,
    sourceText: sign.sign,
  }))

  return {
    stage,
    milestoneAgeMonths,
    alertAgeMonths,
    cards: [...milestoneCards, ...alertCards],
  }
}

/**
 * Semáforo según la libreta CRED:
 * - Rojo: hay al menos una señal de alerta, o tres o más hitos no logrados.
 * - Amarillo: uno o dos hitos no logrados.
 * - Verde: todos los hitos logrados y ninguna señal de alerta.
 */
export function resolveSemaforo(missedMilestones: number, activeAlerts: number): SemaforoLevel {
  if (activeAlerts > 0 || missedMilestones > 2) {
    return "rojo"
  }
  if (missedMilestones > 0) {
    return "amarillo"
  }
  return "verde"
}

/**
 * `answers` guarda la respuesta afirmativa de la familia por tarjeta:
 * en un hito, `true` significa "sí lo hace"; en una alerta, `true` significa
 * "sí he notado esto".
 */
export function evaluateDeck(deck: TinyDeck, answers: Record<string, boolean>): TinyScreeningResult {
  const missedMilestones = deck.cards.filter(
    (card) => card.kind === "hito" && answers[card.id] === false,
  )
  const activeAlerts = deck.cards.filter(
    (card) => card.kind === "alerta" && answers[card.id] === true,
  )
  const answeredCount = deck.cards.filter((card) => answers[card.id] !== undefined).length
  const totalCount = deck.cards.length

  return {
    level: resolveSemaforo(missedMilestones.length, activeAlerts.length),
    missedMilestones,
    activeAlerts,
    answeredCount,
    totalCount,
    coinsEarned: calculateCoins(answeredCount, answeredCount === totalCount),
  }
}

export interface SemaforoCopy {
  title: string
  /** Mensaje literal del "Tamizaje del desarrollo" de la libreta CRED. */
  message: string
  nextStep: string
  celebration: string
}

/** Textos del semáforo, tomados de la sección "Tamizaje del desarrollo". */
export const SEMAFORO_COPY: Record<SemaforoLevel, SemaforoCopy> = {
  verde: {
    title: "Su desarrollo va dentro de lo esperado",
    message:
      "Mi desarrollo ahora está dentro de lo esperado. ¡Vamos muy bien! Sigue llevándome a mis controles de CRED.",
    nextStep: "Sigue con los controles CRED programados y con el juego en casa.",
    celebration: "¡Lo lograron juntos!",
  },
  amarillo: {
    title: "Necesita tu apoyo en algunas habilidades",
    message:
      "Requiero de tu apoyo para mejorar algunas de las habilidades esperadas. El profesional de salud te dará las pautas necesarias.",
    nextStep:
      "Refuerza las actividades en casa y comenta estas respuestas en el próximo control CRED.",
    celebration: "¡Buen trabajo por acompañarlo!",
  },
  rojo: {
    title: "Conviene una evaluación con un especialista",
    message:
      "Necesito una evaluación más profunda con un especialista que pueda incentivar más mi desarrollo y alcanzar las habilidades propias de mi edad.",
    nextStep:
      "Acude al establecimiento de salud y muestra este resultado. Actuar temprano puede marcar la diferencia.",
    celebration: "Gracias por responder con honestidad.",
  },
}

/** Actividades sugeridas por la libreta para reforzar en casa. */
export function getHomeActivities(limit = 4): string[] {
  return CRED_HOME_ACTIVITIES.slice(0, limit)
}
