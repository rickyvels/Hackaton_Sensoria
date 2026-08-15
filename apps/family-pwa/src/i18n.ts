import { useCallback, useEffect, useState } from 'react';

// Quechua sureño (chanka/collao), que es la variante con más hablantes en Perú. Las cadenas
// están pendientes de revisión por una persona quechuahablante: ver docs/i18n-quechua.md.
export type Lang = 'es' | 'qu';

const STORAGE_KEY = 'sensoria-lang';

type Copy = Record<Lang, string>;

export const strings = {
  brandTagline: { es: 'para familias', qu: 'ayllukunapaq' },
  signOut: { es: 'Cerrar sesión', qu: 'Lluqsiy' },
  languageLabel: { es: 'Idioma', qu: 'Rimay' },
  skipToContent: { es: 'Ir al contenido', qu: 'Qillqaman riy' },

  navHome: { es: 'Inicio', qu: 'Qallariy' },
  navAgenda: { es: 'Agenda', qu: 'Tupanakuy' },
  navNotebook: { es: 'Libreta', qu: "P'unchaw qillqa" },
  navDocuments: { es: 'Documentos', qu: 'Qillqakuna' },
  navTeam: { es: 'Equipo', qu: 'Hampiq huñu' },
  navHelp: { es: 'Ayuda', qu: 'Yanapay' },

  stageDetection: { es: 'Detección', qu: 'Tariy' },
  stageReferral: { es: 'Referencia', qu: 'Kachay' },
  stageAssessment: { es: 'Evaluación especializada', qu: 'Yachaysapa qhaway' },
  stageIntervention: { es: 'Intervención', qu: 'Hampiy' },
  stageFollowup: { es: 'Seguimiento', qu: 'Qatipay' },
  stageDischarge: { es: 'Alta y continuidad', qu: 'Lluqsiy, qatiypas' },

  stageShortDetection: { es: 'Detección', qu: 'Tariy' },
  stageShortReferral: { es: 'Referencia', qu: 'Kachay' },
  stageShortAssessment: { es: 'Evaluación', qu: 'Qhaway' },
  stageShortIntervention: { es: 'Intervención', qu: 'Hampiy' },
  stageShortFollowup: { es: 'Seguimiento', qu: 'Qatipay' },
  stageShortDischarge: { es: 'Continuidad', qu: 'Qatiy' },

  greeting: { es: 'HOLA', qu: 'RIMAYKULLAYKI' },
  demoChip: { es: 'Caso demostrativo', qu: 'Qhawachiy kaq' },
  myRoute: { es: 'MI RUTA', qu: 'ÑANNIY' },
  routeHeading: { es: 'Así avanza la atención', qu: 'Kaynatam hampiy ñan puriykun' },
  stageOf: { es: 'ETAPA', qu: 'ÑIQI' },
  of: { es: 'de', qu: 'manta' },
  stepComplete: { es: 'Completada', qu: 'Tukusqa' },
  stepCurrent: { es: 'Etapa actual', qu: 'Kunan ñiqi' },
  stepPending: { es: 'Aún no inicia', qu: 'Manaraq qallarinchu' },

  reportBarrier: { es: 'Reportar una dificultad', qu: 'Sasachakuyta willay' },
  reportInReview: { es: 'Tu aviso está en revisión', qu: 'Willakuyniyki qhawasqa kachkan' },
  safetyNote: {
    es: 'Sensoria organiza el seguimiento. El equipo de salud conserva todas las decisiones de atención.',
    qu: 'Sensoriaqa qatipaytam allichan. Hampiq huñum llapan hampiy akllaykunata hark’an.',
  },

  loginAccess: { es: 'ACCESO FAMILIAR', qu: 'AYLLU YAYKUNA' },
  loginTitle: { es: 'Acompaña su ruta paso a paso.', qu: 'Ñanninta chay chaylla qatipay.' },
  loginSubtitle: {
    es: 'Consulta el seguimiento, las próximas coordinaciones y avisa si aparece una dificultad.',
    qu: 'Qatipayta, hamuq tupanakuykunata qhaway, sasachakuy kaptinpas willay.',
  },
  tabLogin: { es: 'Ingresar', qu: 'Yaykuy' },
  tabRegister: { es: 'Registrarme', qu: 'Qillqakuy' },
  password: { es: 'Contraseña', qu: 'Pakasqa rimay' },
  enterRoute: { es: 'Ingresar a mi ruta', qu: 'Ñanniyman yaykuy' },
  checking: { es: 'Verificando…', qu: 'Qhawachkani…' },
} satisfies Record<string, Copy>;

export type StringKey = keyof typeof strings;

function readStoredLang(): Lang {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'qu' ? 'qu' : 'es';
  } catch {
    // Modo privado o almacenamiento bloqueado: el idioma simplemente no persiste.
    return 'es';
  }
}

// --- Traducción remota -------------------------------------------------------------------
//
// El diccionario de arriba cubre la interfaz al instante. Todo lo demás —lo que redacta el
// backend: mensajes de ruta, títulos de tarea, propuestas de agentes— pasa por el modelo.
//
// La caché es de módulo y no de componente: si cada `useLanguage` tuviera la suya, la pantalla
// de acceso y la aplicación pedirían dos veces las mismas frases. Se persiste en localStorage
// para que una segunda visita no vuelva a pagar la llamada.

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
const CACHE_KEY = 'sensoria-translations-qu';
const FLUSH_DELAY_MS = 250;

const cache: Record<string, string> = readCache();
const listeners = new Set<() => void>();
const pending = new Set<string>();
let flushTimer: number | undefined;

function readCache(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch { return {}; }
}

function persistCache() {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* sin persistencia */ }
}

async function flushPending() {
  flushTimer = undefined;
  const texts = [...pending].slice(0, 60);
  if (!texts.length) return;
  texts.forEach((text) => pending.delete(text));
  try {
    const response = await fetch(`${API_URL}/i18n/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'qu', texts }),
    });
    if (!response.ok) return;
    const body = (await response.json()) as { translations?: Record<string, string> };
    if (!body.translations || !Object.keys(body.translations).length) return;
    Object.assign(cache, body.translations);
    persistCache();
    listeners.forEach((notify) => notify());
  } catch {
    // Sin conexión o sin token en el servidor: la frase se queda en español y se reintentará
    // en la próxima visita. Nunca bloquea la pantalla.
  }
}

function requestTranslation(text: string) {
  if (pending.has(text) || cache[text]) return;
  pending.add(text);
  if (flushTimer === undefined) flushTimer = window.setTimeout(() => void flushPending(), FLUSH_DELAY_MS);
}

export function useLanguage() {
  const [lang, setLang] = useState<Lang>(readStoredLang);
  const [, bump] = useState(0);

  useEffect(() => {
    // El atributo `lang` del documento importa para lectores de pantalla y para la
    // pronunciación sintética, así que se mantiene sincronizado con la elección.
    document.documentElement.lang = lang;
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* sin persistencia */ }
  }, [lang]);

  useEffect(() => {
    const notify = () => bump((value) => value + 1);
    listeners.add(notify);
    return () => { listeners.delete(notify); };
  }, []);

  const t = useCallback((key: StringKey) => strings[key][lang], [lang]);

  const tr = useCallback((text: string | null | undefined) => {
    if (!text || lang === 'es') return text ?? '';
    const hit = cache[text];
    if (hit) return hit;
    requestTranslation(text);
    // Se devuelve el español mientras llega la traducción: preferimos texto entendible a un
    // hueco vacío, y el re-render lo sustituye en cuanto el modelo responde.
    return text;
  }, [lang]);

  return { lang, setLang, t, tr };
}
