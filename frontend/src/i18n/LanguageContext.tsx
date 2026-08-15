import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import { strings, type Lang, type StringKey } from "./strings"

const STORAGE_KEY = "neuroalianza.lang"

interface LanguageContextType {
  lang: Lang
  setLang: (next: Lang) => void
  /** Traduce una clave del diccionario de interfaz. */
  t: (key: StringKey) => string
  /** `true` cuando el idioma activo no es español. */
  isTranslated: boolean
}

function readStoredLang(): Lang {
  if (typeof window === "undefined") {
    return "es"
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === "qu" || stored === "en" ? stored : "es"
  } catch {
    // Modo privado o almacenamiento bloqueado: el idioma simplemente no persiste.
    return "es"
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    // El atributo `lang` del documento importa para lectores de pantalla y para la
    // pronunciación sintética, así que se mantiene sincronizado con la elección.
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin persistencia el idioma dura lo que dure la pestaña.
    }
  }, [])

  const t = useCallback((key: StringKey) => strings[key][lang], [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isTranslated: lang !== "es" }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

/**
 * Variante segura para componentes que pueden montarse fuera del proveedor
 * (por ejemplo en pruebas unitarias de un componente aislado): devuelve el
 * diccionario en español.
 */
export function useOptionalLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (context) {
    return context
  }
  return {
    lang: "es",
    setLang: () => {},
    t: (key: StringKey) => strings[key].es,
    isTranslated: false,
  }
}
