import { useState } from "react"
import {
  User,
  Baby,
  Hospital,
  Translate,
  WifiSlash,
  BellSimple,
  PhoneCall,
  SignOut,
  CaretRight,
  Check,
  ShieldCheck,
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

// Idiomas disponibles
const LANGUAGES = [
  { id: "es", name: "Español", native: "Español (Perú)" },
  { id: "qu-ch", name: "Quechua Chanka", native: "Runasimi (Ayacucho / Apurímac)" },
  { id: "qu-cz", name: "Quechua Cusco", native: "Qhichwa (Cusco / Collao)" },
  { id: "ay", name: "Aymara", native: "Aymar aru (Puno / Altiplano)" },
  { id: "en", name: "English", native: "English (US)" },
]

export function UserProfilePage() {
  const [offlineSync, setOfflineSync] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("es")
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false)

  const currentLang = LANGUAGES.find((l) => l.id === selectedLanguage)?.name || "Español"

  return (
    <div className="-mx-4 -mt-4 flex flex-col">
      {/* 1. Hero Superior con Imagen y Capa Gradiente */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786778108/images_5_zptn4z.jpg')`,
        }}
      >
        {/* Capa Gradiente de arriba hacia abajo (Transparente a Negro 60%) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Barra Superior Espaciadora */}
        <div className="flex items-center justify-between relative z-10 h-20" />

        {/* Sección Central del Perfil */}
        <div className="text-center py-12 pb-10 space-y-3 relative z-10">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white mx-auto shadow-sm">
            <User size={36} weight="regular" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-normal text-white tracking-tight">
              Giovanny Jimenez
            </h1>
            <p className="text-sm font-normal text-white/85">
              Padre de Mateo · 18 meses
            </p>
          </div>
        </div>
      </section>

      {/* 2. Contenido Inferior Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-8 space-y-6 relative z-20 shadow-lg">
        {/* Sección: Paciente Asociado */}
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-foreground">
            Paciente Asociado
          </h2>

          <Card className="bg-card border border-border/80 shadow-none rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Baby size={22} weight="regular" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Mateo Quintanilla
                    </h3>
                    <p className="text-sm font-normal text-muted-foreground">
                      DNI 78349201 · 18 meses
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                  Activo
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Centro de Salud</span>
                  <span className="text-foreground">C.S. San Juan de Miraflores</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hospital de Referencia</span>
                  <span className="text-foreground">INSN San Borja</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección: Preferencias y Ajustes */}
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-foreground">
            Preferencias de la Aplicación
          </h2>

          <div className="space-y-2">
            {/* Opción 1: Selector de Idioma */}
            <button
              type="button"
              onClick={() => setIsLanguageSheetOpen(true)}
              className="w-full p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between hover:bg-muted active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Translate size={20} weight="regular" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Idioma de la aplicación</p>
                  <p className="text-sm text-muted-foreground">{currentLang}</p>
                </div>
              </div>
              <CaretRight size={16} className="text-muted-foreground" />
            </button>

            {/* Opción 2: Modo Offline */}
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <WifiSlash size={20} weight="regular" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Sincronización Offline</p>
                  <p className="text-sm text-muted-foreground">Guardar fichas sin conexión</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOfflineSync(!offlineSync)}
                className={`w-12 h-7 rounded-full transition-colors p-0.5 flex items-center ${offlineSync ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                aria-label="Toggle modo offline"
              >
                <span className="w-6 h-6 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* Opción 3: Notificaciones de Cita */}
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BellSimple size={20} weight="regular" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Avisos de Próximas Citas</p>
                  <p className="text-sm text-muted-foreground">Recordatorios por SMS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-7 rounded-full transition-colors p-0.5 flex items-center ${notifications ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                aria-label="Toggle notificaciones"
              >
                <span className="w-6 h-6 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>
        </section>

        {/* Sección: Asistencia y Contacto Directo */}
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-foreground">
            Líneas de Atención
          </h2>

          <div className="space-y-2">
            <a
              href="tel:113"
              className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between hover:bg-muted active:scale-[0.99] transition-all block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <PhoneCall size={20} weight="regular" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Línea Gratuita Telesalud 113</p>
                  <p className="text-sm text-muted-foreground">Orientación médica MINSA 24/7</p>
                </div>
              </div>
              <CaretRight size={16} className="text-muted-foreground" />
            </a>

            <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Hospital size={20} weight="regular" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">INSN San Borja</p>
                <p className="text-sm text-muted-foreground">Av. Javier Prado Este 3101, Lima</p>
              </div>
            </div>
          </div>
        </section>

        {/* Botón de Seguridad y Cierre */}
        <section className="pt-2">
          <button
            type="button"
            className="w-full h-12 rounded-2xl bg-card border border-border/80 text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/5 active:scale-[0.99] transition-all"
          >
            <SignOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
          <div className="flex items-center justify-center gap-1.5 pt-4 text-sm text-muted-foreground">
            <ShieldCheck size={16} />
            <span>Neuroalianza v1.0 · Datos protegidos por Ley 29733</span>
          </div>
        </section>
      </div>

      {/* 3. Bottom Sheet de Selección de Idioma */}
      <Sheet open={isLanguageSheetOpen} onOpenChange={setIsLanguageSheetOpen}>
        <SheetContent
          side="bottom"
          className="pb-8 pt-4 space-y-4 animate-in slide-in-from-bottom duration-300 ease-out"
        >
          {/* Barra de agarre superior */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-base font-semibold text-foreground">
              Seleccionar Idioma
            </SheetTitle>
            <SheetDescription className="text-sm font-normal text-muted-foreground">
              Elige el idioma preferido para la atención y contenidos de la aplicación.
            </SheetDescription>
          </SheetHeader>

          {/* Lista de Idiomas */}
          <div className="space-y-2 pt-1">
            {LANGUAGES.map((lang, index) => {
              const isSelected = selectedLanguage === lang.id

              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.id)
                    setIsLanguageSheetOpen(false)
                  }}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] animate-in fade-in slide-in-from-bottom-2 duration-300 ${isSelected
                    ? "bg-primary/10 text-primary border border-primary/25 shadow-sm"
                    : "hover:bg-muted text-foreground border border-border/50"
                    }`}
                >
                  <div className="text-left">
                    <p className={`text-base ${isSelected ? "font-semibold text-primary" : "font-medium text-foreground"}`}>
                      {lang.name}
                    </p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {lang.native}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check size={14} weight="bold" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
