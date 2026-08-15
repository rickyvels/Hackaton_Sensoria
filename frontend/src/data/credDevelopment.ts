/**
 * Vigilancia del neurodesarrollo — datos tomados de la Libreta de Control de
 * Crecimiento y Desarrollo (CRED) del MINSA, Perú.
 *
 * Fuentes dentro de la libreta:
 * - "¿Cómo va mi desarrollo?" → tabla "Vigilancia del desarrollo".
 *   Tomado de: Huanca, D. Guía de Vigilancia del Neurodesarrollo.
 * - "Señales de alerta en mi desarrollo".
 *   Adaptado de: Child Development Program Children's Health Service,
 *   Queensland Government. The "Red Flag", Early Intervention Referral Guide
 *   for children 0 - 5 years.
 * - "Tamizaje del desarrollo" → semáforo verde / amarillo / rojo.
 * - "Señales de alto riesgo" → motivos de atención inmediata.
 *
 * Los textos `skill` y `sign` son literales de la libreta para conservar
 * trazabilidad. El campo `question` es la reformulación en lenguaje familiar
 * que se muestra en el juego.
 */

export type DevelopmentArea =
  | "motor_grueso"
  | "motor_fino"
  | "social"
  | "cognitivo"
  | "habla"

export type AlertArea =
  | "socioemocional"
  | "comunicacion"
  | "motor_fino_cognicion"
  | "motor_grueso"

/** Edad en meses. `0` en una señal de alerta significa "cualquier edad". */
export type AgeMonths = number

export interface CredStage {
  id: string
  ageMonths: AgeMonths
  /** Etiqueta larga para lectura ("12 meses"). */
  label: string
  /** Etiqueta corta para la grilla de selección ("12 m"). */
  shortLabel: string
  /** Pista de lo que se espera a esa edad, según la tabla de vigilancia. */
  helper: string
}

export interface CredMilestone {
  id: string
  area: DevelopmentArea
  ageMonths: AgeMonths
  /** Texto literal de la tabla "Vigilancia del desarrollo". */
  skill: string
  /** Pregunta en lenguaje familiar. */
  question: string
}

export interface CredAlertSign {
  id: string
  area: AlertArea
  /** Columna de edad de la tabla; `0` = "cualquier edad". */
  ageMonths: AgeMonths
  /** Texto literal de la tabla "Señales de alerta en mi desarrollo". */
  sign: string
  /** Pregunta en lenguaje familiar. */
  question: string
}

export const DEVELOPMENT_AREA_LABELS: Record<DevelopmentArea, string> = {
  motor_grueso: "Motor grueso",
  motor_fino: "Motor fino",
  social: "Social",
  cognitivo: "Cognitivo",
  habla: "Habla",
}

export const ALERT_AREA_LABELS: Record<AlertArea, string> = {
  socioemocional: "Socioemocional",
  comunicacion: "Comunicación",
  motor_fino_cognicion: "Motor fino y cognición",
  motor_grueso: "Motor grueso",
}

/**
 * Etapas ofrecidas en la selección de edad. Cubren las columnas de la tabla de
 * vigilancia (recién nacido a 30 meses) y las columnas de señales de alerta
 * que llegan hasta los 5 años.
 */
export const CRED_STAGES: CredStage[] = [
  {
    id: "rn",
    ageMonths: 0,
    label: "Recién nacido",
    shortLabel: "Recién nacido",
    helper: "Mira, llora y se acurruca",
  },
  {
    id: "3m",
    ageMonths: 3,
    label: "3 meses",
    shortLabel: "3 meses",
    helper: "Sostiene la cabeza y sonríe",
  },
  {
    id: "6m",
    ageMonths: 6,
    label: "6 meses",
    shortLabel: "6 meses",
    helper: "Se sienta y silabea",
  },
  {
    id: "9m",
    ageMonths: 9,
    label: "9 meses",
    shortLabel: "9 meses",
    helper: "Imita y balbucea",
  },
  {
    id: "12m",
    ageMonths: 12,
    label: "12 meses",
    shortLabel: "12 meses",
    helper: "Camina y señala",
  },
  {
    id: "18m",
    ageMonths: 18,
    label: "18 meses",
    shortLabel: "18 meses",
    helper: "Corre y parlotea",
  },
  {
    id: "24m",
    ageMonths: 24,
    label: "24 meses",
    shortLabel: "2 años",
    helper: "Juega y junta palabras",
  },
  {
    id: "30m",
    ageMonths: 30,
    label: "30 meses",
    shortLabel: "30 meses",
    helper: "Obedece y arma oraciones",
  },
  {
    id: "36m",
    ageMonths: 36,
    label: "3 años",
    shortLabel: "3 años",
    helper: "Juega con otros niños",
  },
  {
    id: "48m",
    ageMonths: 48,
    label: "4 años",
    shortLabel: "4 años",
    helper: "Dibuja y pedalea",
  },
  {
    id: "60m",
    ageMonths: 60,
    label: "5 años",
    shortLabel: "5 años",
    helper: "Se viste y come solo",
  },
]

/**
 * Tabla "Vigilancia del desarrollo" de la libreta CRED.
 * Cada entrada corresponde a una celda de la tabla (área × columna de edad).
 * La tabla original termina en los 30 meses.
 */
export const CRED_MILESTONES: CredMilestone[] = [
  // Recién nacido
  {
    id: "hito-rn-motor-grueso",
    area: "motor_grueso",
    ageMonths: 0,
    skill: "Posición fetal",
    question: "¿Se queda encogidito, con los brazos y piernas doblados hacia su cuerpo?",
  },
  {
    id: "hito-rn-motor-fino",
    area: "motor_fino",
    ageMonths: 0,
    skill: "Hace puño",
    question: "¿Mantiene sus manitos cerradas en puño?",
  },
  {
    id: "hito-rn-social",
    area: "social",
    ageMonths: 0,
    skill: "Mira",
    question: "¿Te mira a la cara cuando lo tienes cerquita?",
  },
  {
    id: "hito-rn-cognitivo",
    area: "cognitivo",
    ageMonths: 0,
    skill: "Mira",
    question: "¿Fija la mirada en tu rostro o en una luz suave?",
  },
  {
    id: "hito-rn-habla",
    area: "habla",
    ageMonths: 0,
    skill: "Llora",
    question: "¿Llora para avisarte que tiene hambre o está incómodo?",
  },

  // 3 meses
  {
    id: "hito-3m-motor-grueso",
    area: "motor_grueso",
    ageMonths: 3,
    skill: "Sostiene la cabeza",
    question: "¿Sostiene su cabeza cuando lo cargas?",
  },
  {
    id: "hito-3m-motor-fino",
    area: "motor_fino",
    ageMonths: 3,
    skill: "Manos abiertas",
    question: "¿Mantiene sus manos abiertas la mayor parte del tiempo?",
  },
  {
    id: "hito-3m-social",
    area: "social",
    ageMonths: 3,
    skill: "Sonríe - ríe",
    question: "¿Te sonríe o se ríe cuando le hablas?",
  },
  {
    id: "hito-3m-cognitivo",
    area: "cognitivo",
    ageMonths: 3,
    skill: "Se interesa",
    question: "¿Se interesa y sigue con la mirada lo que pasa a su alrededor?",
  },
  {
    id: "hito-3m-habla",
    area: "habla",
    ageMonths: 3,
    skill: "Dice algo...",
    question: "¿Hace sonidos como «ajó» o «agú» cuando le conversas?",
  },

  // 6 meses
  {
    id: "hito-6m-motor-grueso",
    area: "motor_grueso",
    ageMonths: 6,
    skill: "Se mantiene sentado",
    question: "¿Se mantiene sentado, con o sin apoyo?",
  },
  {
    id: "hito-6m-motor-fino",
    area: "motor_fino",
    ageMonths: 6,
    skill: "Transfiere",
    question: "¿Pasa un juguete de una mano a la otra?",
  },
  {
    id: "hito-6m-social",
    area: "social",
    ageMonths: 6,
    skill: "Abraza",
    question: "¿Estira los brazos o te abraza cuando te acercas?",
  },
  {
    id: "hito-6m-cognitivo",
    area: "cognitivo",
    ageMonths: 6,
    skill: "Observa con atención",
    question: "¿Observa con atención las cosas que le llaman la atención?",
  },
  {
    id: "hito-6m-habla",
    area: "habla",
    ageMonths: 6,
    skill: "Silabea",
    question: "¿Silabea, como «ma», «ba» o «pa»?",
  },

  // 9 meses
  {
    id: "hito-9m-motor-grueso",
    area: "motor_grueso",
    ageMonths: 9,
    skill: "Se sienta",
    question: "¿Se sienta solito, sin que lo apoyes?",
  },
  {
    id: "hito-9m-motor-fino",
    area: "motor_fino",
    ageMonths: 9,
    skill: "Coge con su mano completa",
    question: "¿Agarra los objetos con toda la mano?",
  },
  {
    id: "hito-9m-social",
    area: "social",
    ageMonths: 9,
    skill: "Imita",
    question: "¿Imita tus gestos, como aplaudir o decir adiós?",
  },
  {
    id: "hito-9m-cognitivo",
    area: "cognitivo",
    ageMonths: 9,
    skill: "Busca",
    question: "¿Busca un juguete que se le cayó o que escondiste?",
  },
  {
    id: "hito-9m-habla",
    area: "habla",
    ageMonths: 9,
    skill: "Balbucea",
    question: "¿Balbucea juntando sonidos, como «ba-ba» o «da-da»?",
  },

  // 12 meses
  {
    id: "hito-12m-motor-grueso",
    area: "motor_grueso",
    ageMonths: 12,
    skill: "Camina",
    question: "¿Camina, con apoyo o solito?",
  },
  {
    id: "hito-12m-motor-fino",
    area: "motor_fino",
    ageMonths: 12,
    skill: "Coge con el dedo índice y pulgar",
    question: "¿Coge cositas pequeñas haciendo pinza con el índice y el pulgar?",
  },
  {
    id: "hito-12m-social",
    area: "social",
    ageMonths: 12,
    skill: "Señala",
    question: "¿Señala con el dedo lo que le llama la atención?",
  },
  {
    id: "hito-12m-cognitivo",
    area: "cognitivo",
    ageMonths: 12,
    skill: "Voltea",
    question: "¿Voltea cuando lo llamas por su nombre?",
  },
  {
    id: "hito-12m-habla",
    area: "habla",
    ageMonths: 12,
    skill: "Señala",
    question: "¿Señala para pedirte algo, en lugar de solo llorar?",
  },

  // 18 meses
  {
    id: "hito-18m-motor-grueso",
    area: "motor_grueso",
    ageMonths: 18,
    skill: "Corre",
    question: "¿Corre, aunque todavía se tropiece a veces?",
  },
  {
    id: "hito-18m-social",
    area: "social",
    ageMonths: 18,
    skill: "Muestra",
    question: "¿Te muestra los objetos que le gustan, acercándotelos?",
  },
  {
    id: "hito-18m-cognitivo",
    area: "cognitivo",
    ageMonths: 18,
    skill: "Reconoce",
    question: "¿Reconoce partes de su cuerpo u objetos cuando se los nombras?",
  },
  {
    id: "hito-18m-habla",
    area: "habla",
    ageMonths: 18,
    skill: "Parlotea",
    question: "¿Parlotea como si conversara, aunque no se le entienda todo?",
  },

  // 24 meses
  {
    id: "hito-24m-social",
    area: "social",
    ageMonths: 24,
    skill: "Juega",
    question: "¿Juega contigo o al lado de otros niños?",
  },
  {
    id: "hito-24m-cognitivo",
    area: "cognitivo",
    ageMonths: 24,
    skill: "Recuerda",
    question: "¿Recuerda dónde están sus cosas o lo que hicieron ayer?",
  },
  {
    id: "hito-24m-habla",
    area: "habla",
    ageMonths: 24,
    skill: "Frasea",
    question: "¿Junta dos palabras para pedir algo, como «más agua»?",
  },

  // 30 meses
  {
    id: "hito-30m-cognitivo",
    area: "cognitivo",
    ageMonths: 30,
    skill: "Obedece",
    question: "¿Obedece indicaciones sencillas, como «trae tu zapato»?",
  },
  {
    id: "hito-30m-habla",
    area: "habla",
    ageMonths: 30,
    skill: "Oraciones",
    question: "¿Arma oraciones cortas de tres palabras o más?",
  },
]

/**
 * Tabla "Señales de alerta en mi desarrollo" de la libreta CRED.
 * La libreta indica buscar la columna de la edad del niño «o la edad menor más
 * cercana» y revisar las señales hacia abajo.
 */
export const CRED_ALERT_SIGNS: CredAlertSign[] = [
  // 6 meses
  {
    id: "alerta-6m-socio-1",
    area: "socioemocional",
    ageMonths: 6,
    sign: "No sonríe o grita en respuesta a los demás.",
    question: "¿Notas que no sonríe ni responde con sonidos cuando le hablan?",
  },
  {
    id: "alerta-6m-comu-1",
    area: "comunicacion",
    ageMonths: 6,
    sign: "No empieza a balbucear.",
    question: "¿Todavía no empieza a balbucear?",
  },
  {
    id: "alerta-6m-fino-1",
    area: "motor_fino_cognicion",
    ageMonths: 6,
    sign: "No alcanza ni coge objetos.",
    question: "¿No alcanza ni coge los objetos que le acercas?",
  },
  {
    id: "alerta-6m-fino-2",
    area: "motor_fino_cognicion",
    ageMonths: 6,
    sign: "Manos frecuentemente cerradas.",
    question: "¿Mantiene sus manos cerradas casi todo el tiempo?",
  },
  {
    id: "alerta-6m-grueso-1",
    area: "motor_grueso",
    ageMonths: 6,
    sign: "No rueda.",
    question: "¿No rueda ni se voltea por sí mismo?",
  },
  {
    id: "alerta-6m-grueso-2",
    area: "motor_grueso",
    ageMonths: 6,
    sign: "No sostiene la cabeza u hombros cuando está boca abajo.",
    question: "¿No sostiene la cabeza ni los hombros cuando está boca abajo?",
  },

  // 9 meses
  {
    id: "alerta-9m-socio-1",
    area: "socioemocional",
    ageMonths: 9,
    sign: "No disfruta de las interacciones y el contacto visual y gestual con otros.",
    question: "¿No disfruta del contacto visual ni de los gestos con otras personas?",
  },
  {
    id: "alerta-9m-comu-1",
    area: "comunicacion",
    ageMonths: 9,
    sign: "No hace gestos.",
    question: "¿No hace gestos, como estirar los brazos o despedirse?",
  },
  {
    id: "alerta-9m-comu-2",
    area: "comunicacion",
    ageMonths: 9,
    sign: "No hace balbuceos de dos partes (ejem. ga ga).",
    question: "¿No hace balbuceos de dos partes, como «ga-ga»?",
  },
  {
    id: "alerta-9m-fino-1",
    area: "motor_fino_cognicion",
    ageMonths: 9,
    sign: "No coge ni suelta objetos.",
    question: "¿No coge ni suelta los objetos a voluntad?",
  },
  {
    id: "alerta-9m-fino-2",
    area: "motor_fino_cognicion",
    ageMonths: 9,
    sign: "No pasa objetos de una mano a otra.",
    question: "¿No pasa los objetos de una mano a la otra?",
  },
  {
    id: "alerta-9m-grueso-1",
    area: "motor_grueso",
    ageMonths: 9,
    sign: "No se sienta sin apoyo.",
    question: "¿No logra sentarse sin apoyo?",
  },
  {
    id: "alerta-9m-grueso-2",
    area: "motor_grueso",
    ageMonths: 9,
    sign: "No se desplaza.",
    question: "¿No se desplaza de un lugar a otro por sí mismo?",
  },
  {
    id: "alerta-9m-grueso-3",
    area: "motor_grueso",
    ageMonths: 9,
    sign: "No soporta su peso en las piernas cuando es sostenido por un adulto.",
    question: "¿No soporta su peso en las piernas cuando lo sostienes de pie?",
  },

  // 12 meses
  {
    id: "alerta-12m-socio-1",
    area: "socioemocional",
    ageMonths: 12,
    sign: "No percibe la llegada de alguien nuevo.",
    question: "¿No se da cuenta cuando llega alguien nuevo a casa?",
  },
  {
    id: "alerta-12m-socio-2",
    area: "socioemocional",
    ageMonths: 12,
    sign: "No juega por turnos.",
    question: "¿No juega por turnos contigo, como pasarse una pelota?",
  },
  {
    id: "alerta-12m-comu-1",
    area: "comunicacion",
    ageMonths: 12,
    sign: "No parlotea.",
    question: "¿No parlotea ni hace sonidos como si conversara?",
  },
  {
    id: "alerta-12m-comu-2",
    area: "comunicacion",
    ageMonths: 12,
    sign: "No responde a palabras familiares.",
    question: "¿No responde a palabras familiares, como su nombre o «mamá»?",
  },
  {
    id: "alerta-12m-fino-1",
    area: "motor_fino_cognicion",
    ageMonths: 12,
    sign: "La mayoría de la nutrición sigue siendo líquida/purés.",
    question: "¿Su alimentación sigue siendo casi toda líquida o en purés?",
  },
  {
    id: "alerta-12m-fino-2",
    area: "motor_fino_cognicion",
    ageMonths: 12,
    sign: "No puede masticar alimentos sólidos.",
    question: "¿No puede masticar alimentos sólidos?",
  },
  {
    id: "alerta-12m-fino-3",
    area: "motor_fino_cognicion",
    ageMonths: 12,
    sign: "No hace pinza con índice y pulgar.",
    question: "¿No hace pinza con el índice y el pulgar?",
  },
  {
    id: "alerta-12m-grueso-1",
    area: "motor_grueso",
    ageMonths: 12,
    sign: "No se arrastra sobre su abdomen.",
    question: "¿No se arrastra sobre su barriguita?",
  },
  {
    id: "alerta-12m-grueso-2",
    area: "motor_grueso",
    ageMonths: 12,
    sign: "No jala para ponerse de pie.",
    question: "¿No se jala de los muebles para ponerse de pie?",
  },
  {
    id: "alerta-12m-grueso-3",
    area: "motor_grueso",
    ageMonths: 12,
    sign: "No se para sosteniéndose de algún mueble.",
    question: "¿No se para sosteniéndose de algún mueble?",
  },

  // 18 meses
  {
    id: "alerta-18m-socio-1",
    area: "socioemocional",
    ageMonths: 18,
    sign: "No muestra interés por compartir e interactuar con los demás.",
    question: "¿No muestra interés por compartir ni interactuar con los demás?",
  },
  {
    id: "alerta-18m-comu-1",
    area: "comunicacion",
    ageMonths: 18,
    sign: "No dice palabras claras.",
    question: "¿No dice ninguna palabra clara?",
  },
  {
    id: "alerta-18m-comu-2",
    area: "comunicacion",
    ageMonths: 18,
    sign: "No sigue indicaciones simples o cortas.",
    question: "¿No sigue indicaciones simples o cortas?",
  },
  {
    id: "alerta-18m-fino-1",
    area: "motor_fino_cognicion",
    ageMonths: 18,
    sign: "No coge o garabatea con una crayola.",
    question: "¿No coge ni garabatea con una crayola?",
  },
  {
    id: "alerta-18m-fino-2",
    area: "motor_fino_cognicion",
    ageMonths: 18,
    sign: "No intenta armar torre de bloques.",
    question: "¿No intenta armar una torre de bloques?",
  },
  {
    id: "alerta-18m-grueso-1",
    area: "motor_grueso",
    ageMonths: 18,
    sign: "No trata de caminar sin apoyo.",
    question: "¿No trata de caminar sin apoyo?",
  },
  {
    id: "alerta-18m-grueso-2",
    area: "motor_grueso",
    ageMonths: 18,
    sign: "No se para solo (sin apoyo).",
    question: "¿No se para solo, sin apoyo?",
  },

  // 2 años
  {
    id: "alerta-24m-socio-1",
    area: "socioemocional",
    ageMonths: 24,
    sign: "Tira o golpea juguetes sin importar la función de los mismos.",
    question: "¿Tira o golpea los juguetes sin usarlos para lo que sirven?",
  },
  {
    id: "alerta-24m-comu-1",
    area: "comunicacion",
    ageMonths: 24,
    sign: "No dice al menos 50 palabras.",
    question: "¿Todavía no dice al menos 50 palabras?",
  },
  {
    id: "alerta-24m-comu-2",
    area: "comunicacion",
    ageMonths: 24,
    sign: "No junta palabras.",
    question: "¿No junta dos palabras para formar frases?",
  },
  {
    id: "alerta-24m-comu-3",
    area: "comunicacion",
    ageMonths: 24,
    sign: "No se entiende la mayor parte de lo que dice.",
    question: "¿No se entiende la mayor parte de lo que dice?",
  },
  {
    id: "alerta-24m-fino-1",
    area: "motor_fino_cognicion",
    ageMonths: 24,
    sign: "No hay signos de autonomía motora gruesa y fina.",
    question: "¿No muestra señales de hacer cosas por sí mismo con sus manos y su cuerpo?",
  },
  {
    id: "alerta-24m-grueso-1",
    area: "motor_grueso",
    ageMonths: 24,
    sign: "No puede correr.",
    question: "¿No puede correr?",
  },
  {
    id: "alerta-24m-grueso-2",
    area: "motor_grueso",
    ageMonths: 24,
    sign: "No sube escaleras.",
    question: "¿No sube escaleras?",
  },
  {
    id: "alerta-24m-grueso-3",
    area: "motor_grueso",
    ageMonths: 24,
    sign: "No tira la pelota.",
    question: "¿No tira la pelota?",
  },

  // 3 años
  {
    id: "alerta-36m-socio-1",
    area: "socioemocional",
    ageMonths: 36,
    sign: "No imita ni le interesa jugar con otros niños.",
    question: "¿No imita ni le interesa jugar con otros niños?",
  },
  {
    id: "alerta-36m-socio-2",
    area: "socioemocional",
    ageMonths: 36,
    sign: "Le cuesta interpretar los sentimientos propios y ajenos.",
    question: "¿Le cuesta reconocer sus sentimientos y los de los demás?",
  },
  {
    id: "alerta-36m-comu-1",
    area: "comunicacion",
    ageMonths: 36,
    sign: "No se entiende lo que dice.",
    question: "¿No se entiende lo que dice?",
  },
  {
    id: "alerta-36m-comu-2",
    area: "comunicacion",
    ageMonths: 36,
    sign: "No usa oraciones simples.",
    question: "¿No usa oraciones simples?",
  },
  {
    id: "alerta-36m-fino-1",
    area: "motor_fino_cognicion",
    ageMonths: 36,
    sign: "No se apoya a sí mismo para valerse por sí solo.",
    question: "¿No hace cosas por sí solo para valerse, como comer o lavarse las manos?",
  },
  {
    id: "alerta-36m-fino-2",
    area: "motor_fino_cognicion",
    ageMonths: 36,
    sign: "Dificultad para coger objetos pequeños.",
    question: "¿Tiene dificultad para coger objetos pequeños?",
  },
  {
    id: "alerta-36m-grueso-1",
    area: "motor_grueso",
    ageMonths: 36,
    sign: "No corre bien.",
    question: "¿No corre bien?",
  },
  {
    id: "alerta-36m-grueso-2",
    area: "motor_grueso",
    ageMonths: 36,
    sign: "No sube ni baja escaleras.",
    question: "¿No sube ni baja escaleras?",
  },
  {
    id: "alerta-36m-grueso-3",
    area: "motor_grueso",
    ageMonths: 36,
    sign: "No tira o patea la pelota.",
    question: "¿No tira ni patea la pelota?",
  },
  {
    id: "alerta-36m-grueso-4",
    area: "motor_grueso",
    ageMonths: 36,
    sign: "No salta en 2 pies.",
    question: "¿No salta con los dos pies?",
  },

  // 4 años
  {
    id: "alerta-48m-socio-1",
    area: "socioemocional",
    ageMonths: 48,
    sign: "Poco dispuesto a jugar colaborativamente.",
    question: "¿Está poco dispuesto a jugar en equipo con otros niños?",
  },
  {
    id: "alerta-48m-comu-1",
    area: "comunicacion",
    ageMonths: 48,
    sign: "No se entiende lo que dice.",
    question: "¿Las personas fuera de casa no entienden lo que dice?",
  },
  {
    id: "alerta-48m-comu-2",
    area: "comunicacion",
    ageMonths: 48,
    sign: "No sigue indicaciones de 2 pasos.",
    question: "¿No sigue indicaciones de dos pasos?",
  },
  {
    id: "alerta-48m-comu-3",
    area: "comunicacion",
    ageMonths: 48,
    sign: "Sigue usando pañal durante el día.",
    question: "¿Sigue usando pañal durante el día?",
  },
  {
    id: "alerta-48m-fino-1",
    area: "motor_fino_cognicion",
    ageMonths: 48,
    sign: "No puede dibujar líneas o círculos.",
    question: "¿No puede dibujar líneas ni círculos?",
  },
  {
    id: "alerta-48m-fino-2",
    area: "motor_fino_cognicion",
    ageMonths: 48,
    sign: "No pedalea.",
    question: "¿No pedalea en un triciclo o bicicleta?",
  },
  {
    id: "alerta-48m-grueso-1",
    area: "motor_grueso",
    ageMonths: 48,
    sign: "No atrapa, lanza o patea la pelota.",
    question: "¿No atrapa, lanza ni patea la pelota?",
  },
  {
    id: "alerta-48m-grueso-2",
    area: "motor_grueso",
    ageMonths: 48,
    sign: "No mantiene equilibrio cuando está en un pie.",
    question: "¿No mantiene el equilibrio parado en un pie?",
  },

  // 5 años
  {
    id: "alerta-60m-socio-1",
    area: "socioemocional",
    ageMonths: 60,
    sign: "Juega diferente a los niños de su edad.",
    question: "¿Juega de manera muy distinta a los niños de su edad?",
  },
  {
    id: "alerta-60m-comu-1",
    area: "comunicacion",
    ageMonths: 60,
    sign: "Dificultad para decir lo que está mal.",
    question: "¿Le cuesta contarte qué le pasa o qué le duele?",
  },
  {
    id: "alerta-60m-comu-2",
    area: "comunicacion",
    ageMonths: 60,
    sign: "No responde preguntas.",
    question: "¿No responde preguntas?",
  },
  {
    id: "alerta-60m-comu-3",
    area: "comunicacion",
    ageMonths: 60,
    sign: "Preocupación de docente por su aprendizaje.",
    question: "¿Su maestra o maestro ha mostrado preocupación por su aprendizaje?",
  },
  {
    id: "alerta-60m-fino-1",
    area: "motor_fino_cognicion",
    ageMonths: 60,
    sign: "No se viste ni come solo(a).",
    question: "¿No se viste ni come solo?",
  },
  {
    id: "alerta-60m-fino-2",
    area: "motor_fino_cognicion",
    ageMonths: 60,
    sign: "No puede dibujar figuras simples.",
    question: "¿No puede dibujar figuras simples?",
  },
  {
    id: "alerta-60m-grueso-1",
    area: "motor_grueso",
    ageMonths: 60,
    sign: "Camina, corre o sube escaleras de manera rara.",
    question: "¿Camina, corre o sube escaleras de una manera que te parece rara?",
  },
  {
    id: "alerta-60m-grueso-2",
    area: "motor_grueso",
    ageMonths: 60,
    sign: "No manipula la pelota como sus pares.",
    question: "¿No maneja la pelota como los niños de su edad?",
  },
  {
    id: "alerta-60m-grueso-3",
    area: "motor_grueso",
    ageMonths: 60,
    sign: "No salta 5 veces en un mismo pie.",
    question: "¿No salta cinco veces sobre un mismo pie?",
  },

  // Cualquier edad
  {
    id: "alerta-cualquier-1",
    area: "socioemocional",
    ageMonths: 0,
    sign: "Fuertes preocupaciones de los padres.",
    question: "¿Tienes una preocupación fuerte sobre su desarrollo?",
  },
  {
    id: "alerta-cualquier-2",
    area: "socioemocional",
    ageMonths: 0,
    sign: "Pérdida significativa de habilidades.",
    question: "¿Ha perdido alguna habilidad que antes ya sabía hacer?",
  },
  {
    id: "alerta-cualquier-3",
    area: "comunicacion",
    ageMonths: 0,
    sign: "Falta de respuesta al sonido o estimulación visual.",
    question: "¿No responde a los sonidos fuertes ni a lo que ve?",
  },
  {
    id: "alerta-cualquier-4",
    area: "socioemocional",
    ageMonths: 0,
    sign: "Pobre integración con adultos u otras niñas o niños.",
    question: "¿Le cuesta mucho integrarse con adultos u otros niños?",
  },
  {
    id: "alerta-cualquier-5",
    area: "motor_grueso",
    ageMonths: 0,
    sign: "Diferencia entre lado derecho y izquierdo en cuestión de fuerza, movimiento o tono.",
    question: "¿Notas diferencia entre su lado derecho e izquierdo en fuerza o movimiento?",
  },
  {
    id: "alerta-cualquier-6",
    area: "motor_grueso",
    ageMonths: 0,
    sign: "Pérdida de movimiento flojo (de tono lento) o rígido y tenso (tono alto).",
    question: "¿Sientes su cuerpo demasiado flojo o demasiado rígido?",
  },
]

/**
 * "Señales de alto riesgo" de la libreta CRED: motivos para acudir de
 * inmediato al puesto o centro de salud. No forman parte del puntaje del
 * juego; se muestran como recordatorio de seguridad.
 */
export const CRED_HIGH_RISK_SIGNS: string[] = [
  "No lacto bien o me ahogo con la leche.",
  "Tengo fiebre mayor a 38 grados que no cede con baños de agua tibia.",
  "Tengo vómitos frecuentes.",
  "Duermo más de lo habitual y no respondo a ningún estímulo.",
  "Tengo dificultad para respirar (respiración rápida y agitada, se hunde la piel entre las costillas).",
  "No puedo tomar líquidos con facilidad.",
  "Tengo diarrea más de 10 veces al día o 4 veces en 4 horas de abundante cantidad.",
  "Mis labios o piel tienen una coloración azulada o morada.",
  "Si convulsiono o tiemblo sin control.",
  "Tengo llanto distinto al habitual (muy largo, muy corto o no se calma con nada).",
  "No respondo a ruidos fuertes.",
]

/**
 * "Promoviendo mi desarrollo": actividades sugeridas por la libreta CRED para
 * reforzar en casa.
 */
export const CRED_HOME_ACTIVITIES: string[] = [
  "Mírame, sonríeme y conversa conmigo mientras me cuidas.",
  "Responde a los sonidos y palabras que digo, aunque todavía no sepa hablar.",
  "Aprovecha las actividades diarias para interactuar conmigo y jugar.",
  "Juega detrás de un pañuelo para escondernos haciendo sonidos graciosos.",
  "Dame un espacio limpio y seguro para jugar.",
  "Léeme cuentos o nárrame historias todos los días.",
  "Elogia mi conducta cuando es adecuada; esto me ayuda a aprender.",
  "Déjame usar el vaso y la cuchara y explorar el sabor y textura de la comida.",
]

/**
 * Edades en las que la libreta CRED programa un tamizaje del desarrollo,
 * "y a cualquier edad si tú o el profesional de salud tienen alguna preocupación".
 */
export const CRED_SCREENING_AGES_MONTHS: readonly number[] = [1, 6, 9, 18, 30, 42, 60]
