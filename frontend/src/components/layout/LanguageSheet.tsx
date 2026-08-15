import { Check } from "@phosphor-icons/react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useOptionalLanguage } from "@/i18n/LanguageContext"
import { LANGUAGES, PLANNED_LANGUAGES } from "@/i18n/strings"

export interface LanguageSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Selector de idioma compartido por el inicio y el perfil. Los idiomas todavía
 * sin traducir se listan aparte y no son accionables: un botón que no cambia
 * nada es peor que decir que falta.
 */
export function LanguageSheet({ open, onOpenChange }: LanguageSheetProps) {
  const { lang, setLang, t } = useOptionalLanguage()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] space-y-4 overflow-y-auto pb-8 pt-4">
        <div className="mx-auto h-1 w-12 rounded-full bg-muted-foreground/30" />

        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="text-base font-semibold text-foreground">
            {t("languageTitle")}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {t("languageSubtitle")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 pt-1">
          {LANGUAGES.map((option) => {
            const isSelected = lang === option.id

            return (
              <button
                key={option.id}
                type="button"
                lang={option.id}
                onClick={() => {
                  setLang(option.id)
                  onOpenChange(false)
                }}
                className={`flex min-h-14 w-full items-center justify-between rounded-2xl p-3.5 transition-all active:scale-[0.99] ${
                  isSelected
                    ? "border border-primary/30 bg-primary/10 text-primary"
                    : "border border-border/70 text-foreground hover:bg-muted"
                }`}
              >
                <span className="min-w-0 text-left">
                  <span
                    className={`block text-base ${
                      isSelected ? "font-semibold text-primary" : "font-medium text-foreground"
                    }`}
                  >
                    {option.name}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {option.native}
                  </span>
                </span>
                {isSelected && (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check size={14} weight="bold" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-2 border-t border-border/70 pt-4">
          <p className="text-sm text-muted-foreground">{t("languagePlannedNote")}</p>
          {PLANNED_LANGUAGES.map((option) => (
            <div
              key={option.name}
              className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 p-3.5 opacity-70"
            >
              <span className="min-w-0">
                <span className="block text-base font-medium text-foreground">{option.name}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {option.native}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                {t("languagePlanned")}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
