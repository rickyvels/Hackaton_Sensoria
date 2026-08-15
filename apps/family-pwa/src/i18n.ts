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

export function useLanguage() {
  const [lang, setLang] = useState<Lang>(readStoredLang);

  useEffect(() => {
    // El atributo `lang` del documento importa para lectores de pantalla y para la
    // pronunciación sintética, así que se mantiene sincronizado con la elección.
    document.documentElement.lang = lang;
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* sin persistencia */ }
  }, [lang]);

  const t = useCallback((key: StringKey) => strings[key][lang], [lang]);
  return { lang, setLang, t };
}
