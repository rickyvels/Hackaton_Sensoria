import { describe, expect, it } from "vitest"

import { CRED_STAGES } from "@/data/credDevelopment"
import {
  COINS_ON_COMPLETION,
  COINS_PER_ANSWER,
  buildDeck,
  calculateCoins,
  evaluateDeck,
  findStageForAge,
  getAlertSignsForAge,
  getMilestonesForAge,
  resolveSemaforo,
} from "./tinyScreening"

function stageById(id: string) {
  const stage = CRED_STAGES.find((candidate) => candidate.id === id)
  if (!stage) {
    throw new Error(`Etapa de prueba no encontrada: ${id}`)
  }
  return stage
}

describe("selección de columnas de la libreta CRED", () => {
  it("usa la columna de hitos exacta cuando la edad coincide", () => {
    expect(getMilestonesForAge(12).columnAgeMonths).toBe(12)
    expect(getMilestonesForAge(0).columnAgeMonths).toBe(0)
  })

  it("usa la edad menor más cercana cuando no hay columna exacta", () => {
    expect(getMilestonesForAge(15).columnAgeMonths).toBe(12)
    expect(getAlertSignsForAge(15).columnAgeMonths).toBe(12)
  })

  it("reutiliza la última columna documentada (30 meses) para edades mayores", () => {
    expect(getMilestonesForAge(60).columnAgeMonths).toBe(30)
  })

  it("incluye siempre las señales marcadas como 'cualquier edad'", () => {
    const { anyAge } = getAlertSignsForAge(6)
    expect(anyAge.length).toBeGreaterThan(0)
    expect(anyAge.every((sign) => sign.ageMonths === 0)).toBe(true)
  })

  it("mapea una edad libre a la etapa correspondiente", () => {
    expect(findStageForAge(19).id).toBe("18m")
    expect(findStageForAge(2).id).toBe("rn")
    expect(findStageForAge(200).id).toBe("60m")
  })
})

describe("construcción del mazo", () => {
  it("pone primero los hitos y después las señales de alerta", () => {
    const deck = buildDeck(stageById("12m"))
    const firstAlertIndex = deck.cards.findIndex((card) => card.kind === "alerta")
    const lastMilestoneIndex = deck.cards.map((card) => card.kind).lastIndexOf("hito")

    expect(firstAlertIndex).toBeGreaterThan(lastMilestoneIndex)
  })

  it("incluye hitos y alertas para cada etapa ofrecida", () => {
    for (const stage of CRED_STAGES) {
      const deck = buildDeck(stage)
      expect(deck.cards.some((card) => card.kind === "hito")).toBe(true)
      expect(deck.cards.some((card) => card.kind === "alerta")).toBe(true)
    }
  })

  it("no repite identificadores de tarjeta", () => {
    const deck = buildDeck(stageById("6m"))
    const ids = deck.cards.map((card) => card.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("semáforo del tamizaje del desarrollo", () => {
  it("es verde sin hitos fallidos ni alertas", () => {
    expect(resolveSemaforo(0, 0)).toBe("verde")
  })

  it("es amarillo con uno o dos hitos no logrados", () => {
    expect(resolveSemaforo(1, 0)).toBe("amarillo")
    expect(resolveSemaforo(2, 0)).toBe("amarillo")
  })

  it("es rojo con tres o más hitos no logrados", () => {
    expect(resolveSemaforo(3, 0)).toBe("rojo")
  })

  it("es rojo con una sola señal de alerta, aunque todos los hitos estén logrados", () => {
    expect(resolveSemaforo(0, 1)).toBe("rojo")
  })
})

describe("evaluación de un mazo respondido", () => {
  const deck = buildDeck(stageById("12m"))
  const milestoneCards = deck.cards.filter((card) => card.kind === "hito")
  const alertCards = deck.cards.filter((card) => card.kind === "alerta")

  function answerAll(milestoneValue: boolean, alertValue: boolean) {
    return Object.fromEntries(
      deck.cards.map((card) => [card.id, card.kind === "hito" ? milestoneValue : alertValue]),
    )
  }

  it("da verde cuando la familia confirma todos los hitos y ninguna alerta", () => {
    const result = evaluateDeck(deck, answerAll(true, false))
    expect(result.level).toBe("verde")
    expect(result.missedMilestones).toHaveLength(0)
    expect(result.activeAlerts).toHaveLength(0)
  })

  it("da rojo y lista las señales cuando la familia marca alertas", () => {
    const result = evaluateDeck(deck, answerAll(true, true))
    expect(result.level).toBe("rojo")
    expect(result.activeAlerts).toHaveLength(alertCards.length)
    expect(result.activeAlerts[0].sourceText).toBeTruthy()
  })

  it("da amarillo con un solo hito no logrado", () => {
    const answers = answerAll(true, false)
    answers[milestoneCards[0].id] = false

    const result = evaluateDeck(deck, answers)
    expect(result.level).toBe("amarillo")
    expect(result.missedMilestones).toHaveLength(1)
  })

  it("no cuenta como fallidas las tarjetas todavía sin responder", () => {
    const result = evaluateDeck(deck, {})
    expect(result.answeredCount).toBe(0)
    expect(result.missedMilestones).toHaveLength(0)
    expect(result.level).toBe("verde")
  })
})

describe("NeuroCoins", () => {
  it("otorga lo mismo por cada respuesta, sea cual sea el contenido", () => {
    const deck = buildDeck(stageById("6m"))
    const optimistic = Object.fromEntries(
      deck.cards.map((card) => [card.id, card.kind === "hito"]),
    )
    const worried = Object.fromEntries(
      deck.cards.map((card) => [card.id, card.kind === "alerta"]),
    )

    expect(evaluateDeck(deck, optimistic).coinsEarned).toBe(
      evaluateDeck(deck, worried).coinsEarned,
    )
  })

  it("suma el bono solo al completar el mazo", () => {
    expect(calculateCoins(3, false)).toBe(3 * COINS_PER_ANSWER)
    expect(calculateCoins(3, true)).toBe(3 * COINS_PER_ANSWER + COINS_ON_COMPLETION)
  })
})
