/**
 * Diccionario de la interfaz.
 *
 * Cubre el "chrome" de la aplicación: navegación, encabezados, botones y
 * etiquetas de formulario. NO cubre el contenido clínico de la Libreta CRED
 * (hitos del desarrollo, señales de alerta, textos del semáforo): esos textos
 * se citan literalmente de un documento oficial del MINSA y traducirlos sin
 * revisión de una persona quechuahablante podría hacer que una familia
 * entienda mal una señal de alarma. Ver `docs/I18N.md`.
 *
 * El quechua sureño (chanka/collao) proviene del borrador de Hackaton_Sensoria
 * y sigue pendiente de revisión por una persona quechuahablante.
 */

export type Lang = "es" | "qu" | "en"

export interface LanguageOption {
  id: Lang
  /** Nombre en español, para quien busca desde la interfaz en español. */
  name: string
  /** Nombre en el propio idioma: quien lo busca lo reconoce aunque no lea español. */
  native: string
  /** Código corto para el conmutador compacto. */
  short: string
}

export const LANGUAGES: LanguageOption[] = [
  { id: "es", name: "Español", native: "Español (Perú)", short: "ES" },
  { id: "qu", name: "Quechua sureño", native: "Runasimi (Chanka / Collao)", short: "QU" },
  { id: "en", name: "English", native: "English (US)", short: "EN" },
]

/**
 * Idiomas que la aplicación muestra como previstos pero todavía no traduce.
 * Se listan de forma explícita para no ofrecer un botón que no hace nada.
 */
export const PLANNED_LANGUAGES = [
  { name: "Aymara", native: "Aymar aru (Puno / Altiplano)" },
  { name: "Quechua Cusco", native: "Qhichwa (Cusco / Collao)" },
]

type Copy = Record<Lang, string>

export const strings = {
  // Marca y generales
  brandTagline: { es: "para familias", qu: "ayllukunapaq", en: "for families" },
  languageLabel: { es: "Idioma", qu: "Rimay", en: "Language" },
  languageTitle: { es: "Seleccionar idioma", qu: "Rimayta akllay", en: "Select language" },
  languageSubtitle: {
    es: "Elige el idioma preferido para los contenidos de la aplicación.",
    qu: "Aplicacionpa rimayninta akllay.",
    en: "Choose your preferred language for the app content.",
  },
  languagePlanned: { es: "Próximamente", qu: "Ñachallanmi", en: "Coming soon" },
  languagePlannedNote: {
    es: "Estos idiomas están previstos y aún no tienen traducción disponible.",
    qu: "Kay rimaykunaqa manaraqmi tikrasqachu kachkan.",
    en: "These languages are planned and not translated yet.",
  },
  signOut: { es: "Cerrar sesión", qu: "Lluqsiy", en: "Sign out" },
  back: { es: "Volver", qu: "Kutiy", en: "Back" },
  close: { es: "Cerrar", qu: "Wichqay", en: "Close" },
  continue: { es: "Continuar", qu: "Qatiy", en: "Continue" },
  seeAll: { es: "Ver todos", qu: "Llapanta qhaway", en: "See all" },
  see: { es: "Ver", qu: "Qhaway", en: "See" },

  // Navegación inferior
  navHome: { es: "Home", qu: "Qallariy", en: "Home" },
  navResources: { es: "Recursos", qu: "Yanapaqkuna", en: "Resources" },
  navAppointments: { es: "Citas", qu: "Tupanakuy", en: "Appointments" },
  navProfile: { es: "Perfil", qu: "Willakuyniy", en: "Profile" },
  navCenterAction: {
    es: "Jugar con Tiny y revisar el desarrollo de mi hijo",
    qu: "Tinywan pukllay, wawaypa wiñayninta qhaway",
    en: "Play with Tiny and check my child's development",
  },
  navAssistant: {
    es: "Asistente de Inteligencia Artificial",
    qu: "Yachay yanapaq",
    en: "AI assistant",
  },

  // Inicio
  homeWelcome: { es: "Bienvenido", qu: "Allin hamusqayki", en: "Welcome" },
  homeGuest: { es: "Familia", qu: "Ayllu", en: "Family" },
  profileCaregiverOf: { es: "de", qu: "-pa", en: "of" },
  profileNoPatient: {
    es: "Aún no registraste al niño o niña",
    qu: "Manaraqmi wawata qillqarqankichu",
    en: "No child registered yet",
  },
  profilePatientSection: { es: "Paciente Asociado", qu: "Tupaq unquq", en: "Linked patient" },
  profileInsurance: { es: "Seguro", qu: "Seguro", en: "Insurance" },
  homeActionChild: { es: "Mi hijo", qu: "Wawaymi", en: "My child" },
  homeActionRoute: { es: "Mi Ruta", qu: "Ñanniy", en: "My route" },
  homeActionResources: { es: "Recursos", qu: "Yanapaqkuna", en: "Resources" },
  homeActionFamily: { es: "Familia", qu: "Ayllu", en: "Family" },
  homeNextCare: {
    es: "Tu próxima atención está programada",
    qu: "Hamuq hampikuyniyki churasqaña kachkan",
    en: "Your next appointment is scheduled",
  },
  homeLastProcess: { es: "Último Proceso", qu: "Qhipa ruray", en: "Latest process" },
  homeSeeRoute: { es: "Ver ruta", qu: "Ñanta qhaway", en: "See route" },
  homeLearnWithUs: { es: "Aprende con Nosotros", qu: "Ñuqaykuwan yachay", en: "Learn with us" },

  // NeuroCoins y juego de Tiny
  neuroCoins: { es: "NeuroCoins", qu: "NeuroCoins", en: "NeuroCoins" },
  neuroCoinsLabel: {
    es: "NeuroCoins acumuladas",
    qu: "Huñusqa NeuroCoins",
    en: "NeuroCoins earned",
  },
  tinyGameTitle: { es: "Juego del desarrollo", qu: "Wiñay pukllay", en: "Development game" },
  tinyHello: { es: "¡Hola! Soy Tiny", qu: "¡Rimaykullayki! Tinym kani", en: "Hi! I'm Tiny" },
  tinyIntro: {
    es: "Vamos a revisar juntos cómo va el desarrollo de tu pequeño, con las mismas preguntas de la Libreta CRED del MINSA.",
    qu: "Kuska qhawasun wawaykipa wiñayninta, MINSApa CRED qillqanpa tapuykunallawantaq.",
    en: "Let's check your child's development together, using the same questions from the MINSA CRED booklet.",
  },
  tinyAgeQuestion: { es: "¿Cuántos meses tiene?", qu: "¿Hayk'a killayuqmi?", en: "How many months old?" },
  tinyAgeHelp: {
    es: "Elige su edad o la edad menor más cercana, como indica la libreta.",
    qu: "Watanta akllay, manaqa aswan sispa uchuy watata, qillqa nisqanman hina.",
    en: "Pick their age or the nearest lower age, as the booklet indicates.",
  },
  tinyTheirAge: { es: "Su edad", qu: "Watanmi", en: "Their age" },
  tinyReady: { es: "¡Que empiece la aventura!", qu: "¡Puriy qallarichun!", en: "Let the adventure begin!" },
  tinyStart: { es: "Empezar", qu: "Qallariy", en: "Start" },
  tinyCloseGame: { es: "Cerrar el juego de Tiny", qu: "Tinypa pukllayninta wichqay", en: "Close Tiny's game" },
  tinyProgressLabel: { es: "Avance del tamizaje", qu: "Qhawaypa puriynin", en: "Screening progress" },
  tinyAlertBadge: { es: "Señal de alerta", qu: "Willakuy unancha", en: "Warning sign" },
  tinyYes: { es: "¡Sí, lo hace!", qu: "¡Arí, ruwanmi!", en: "Yes, they do!" },
  tinyNotYet: { es: "Aún no / a veces", qu: "Manaraq / mayninpi", en: "Not yet / sometimes" },
  tinyAlertYes: { es: "Sí, he notado esto", qu: "Arí, kayta rikuni", en: "Yes, I've noticed this" },
  tinyAlertNo: { es: "No lo he notado", qu: "Manam rikunichu", en: "I haven't noticed it" },
  tinyPlayAgain: { es: "Jugar con otra edad", qu: "Huk watawan pukllay", en: "Play with another age" },
  tinyOf: { es: "de", qu: "manta", en: "of" },

  // Acceso familiar
  accessKicker: { es: "Acceso familiar", qu: "Ayllu yaykuna", en: "Family access" },
  accessRegisterKicker: { es: "Crear mi acceso", qu: "Yaykunayta kamay", en: "Create my access" },
  accessTitle: {
    es: "Acompaña su ruta paso a paso.",
    qu: "Ñanninta chay chaylla qatipay.",
    en: "Follow their route step by step.",
  },
  accessRegisterTitle: {
    es: "Empecemos con tus datos.",
    qu: "Willakuyniykiwan qallarisun.",
    en: "Let's start with your details.",
  },
  accessSubtitle: {
    es: "Consulta el seguimiento, las próximas coordinaciones y avisa si aparece una dificultad.",
    qu: "Qatipayta, hamuq tupanakuykunata qhaway, sasachakuy kaptinpas willay.",
    en: "Check the follow-up, upcoming coordination, and report any difficulty.",
  },
  accessRegisterSubtitle: {
    es: "Elige una contraseña y entra de inmediato. El equipo verificará los datos después.",
    qu: "Pakasqa rimayta akllaspa kunallan yaykuy. Hampiq huñum qhipata qhawanqa.",
    en: "Choose a password and enter right away. The team will verify the details later.",
  },
  tabLogin: { es: "Ingresar", qu: "Yaykuy", en: "Sign in" },
  tabRegister: { es: "Registrarme", qu: "Qillqakuy", en: "Register" },
  fieldDni: { es: "DNI", qu: "DNI", en: "ID number" },
  fieldPassword: { es: "Contraseña", qu: "Pakasqa rimay", en: "Password" },
  enterRoute: { es: "Ingresar a mi ruta", qu: "Ñanniyman yaykuy", en: "Enter my route" },
  createAccess: { es: "Crear mi acceso y entrar", qu: "Yaykunayta kamaspa yaykuy", en: "Create access and enter" },

  // Seguro del paciente
  insuranceLegend: { es: "Seguro del paciente", qu: "Unquqpa seguron", en: "Patient's insurance" },
  insuranceHelp: {
    es: "Sirve para saber a qué establecimientos puede ser derivado y qué trámites corresponden.",
    qu: "Maypi hampichikunanta, ima ruraykunatapas yachanapaqmi.",
    en: "Used to know which facilities they can be referred to and which paperwork applies.",
  },
  insuranceWhich: { es: "¿Cuál?", qu: "¿Mayqin?", en: "Which one?" },
  insuranceCode: {
    es: "Número de afiliación (opcional)",
    qu: "Afiliación yupay (munaspa)",
    en: "Membership number (optional)",
  },

  // Aviso de contenido clínico sin traducir
  clinicalSpanishNotice: {
    es: "",
    qu: "Wiñaymanta tapuykunaqa castellanopiraqmi kachkan: MINSApa qillqanmantam hurqusqa, runasimi rimaqpa qhawayninta suyachkan.",
    en: "Development questions remain in Spanish: they are quoted from the MINSA booklet and are awaiting review by a certified translator.",
  },
} satisfies Record<string, Copy>

export type StringKey = keyof typeof strings
