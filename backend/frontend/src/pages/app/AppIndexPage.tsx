import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Translate,
  Check,
  CaretRight,
  Baby,
  ArrowsClockwise,
  ListBullets,
  UsersThree,
  Heartbeat,
  Info,
  CalendarCheck,
  Hospital,
  MapPin,
  PhoneCall,
  CalendarBlank,
} from "@phosphor-icons/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

// Idiomas disponibles en la red de salud
const LANGUAGES = [
  { id: "es", name: "Español", native: "Español (Perú)" },
  { id: "qu-ch", name: "Quechua Chanka", native: "Runasimi (Ayacucho / Apurímac)" },
  { id: "qu-cz", name: "Quechua Cusco", native: "Qhichwa (Cusco / Collao)" },
  { id: "ay", name: "Aymara", native: "Aymar aru (Puno / Altiplano)" },
  { id: "en", name: "English", native: "English (US)" },
]

// Recursos destacados con portadas ilustradas
const FEATURED_RESOURCES = [
  {
    id: "1",
    title: "Estimulación del lenguaje en casa",
    category: "12 - 24 meses",
    readTime: "3 min",
    image: "https://res.cloudinary.com/de1xmnmeq/image/upload/v1786777517/images_3_rmd6xc.jpg",
  },
  {
    id: "2",
    title: "Hitos motores y señales de alerta",
    category: "0 - 18 meses",
    readTime: "4 min",
    image: "https://res.cloudinary.com/de1xmnmeq/image/upload/v1786778108/images_5_zptn4z.jpg",
  },
  {
    id: "3",
    title: "Guía de rutinas y juego sensorial",
    category: "2 - 5 años",
    readTime: "5 min",
    image: "https://res.cloudinary.com/de1xmnmeq/image/upload/v1786777435/pastel-mountains-vector-art-05xdup4f0zu2tvqa_km0pbp.jpg",
  },
]

export function AppIndexPage() {
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false)
  const [isAppointmentSheetOpen, setIsAppointmentSheetOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("es")

  return (
    <div className="-mx-4 -mt-4 flex flex-col">
      {/* 1. Hero Superior con Imagen y Capa Gradiente */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786776308/paisaje-monta%C3%B1oso-low-poly-al-amanecer-con-degradados-pastel-en-los-picos-fondo-de-pantalla-para-m%C3%B3vil-experimenta-la-serena-378149134_pfiikg.webp')`,
        }}
      >
        {/* Capa Gradiente de arriba hacia abajo (Transparente a Negro 60%) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Barra Superior con Logo y Selector de Idioma */}
        <div className="flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Heartbeat size={22} weight="bold" className="text-white" />
            </div>
            <span className="text-base font-normal text-white">
              Neuro<span className="font-semibold text-white/90">alianza</span>
            </span>
          </Link>

          {/* Botón de Idioma (Limpio y translúcido) */}
          <button
            type="button"
            onClick={() => setIsLanguageSheetOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-transform"
            aria-label="Seleccionar idioma"
          >
            <Translate size={22} weight="regular" />
          </button>
        </div>

        {/* Sección Central Destacada del Hero */}
        <div className="text-center py-20 relative z-10 space-y-1.5">
          <p className="text-lg font-normal text-white/85">
            Bienvenido
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Giovanny Jimenez
          </h1>
        </div>

        {/* Fila de 4 Acciones Rápidas Circulares Minimalistas */}
        <div className="grid grid-cols-4 gap-3 pt-2 relative z-10 max-w-sm mx-auto">
          {/* Acción 1: Mi hijo */}
          <Link to="/app/mi-hijo" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/25 active:scale-95 backdrop-blur-md flex items-center justify-center text-white border border-white/25 transition-all shadow-sm">
              <Baby size={24} weight="bold" />
            </div>
            <span className="text-sm font-normal text-white/90 text-center leading-tight">
              Mi hijo
            </span>
          </Link>

          {/* Acción 2: Mi Ruta */}
          <Link to="/app/citas" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/25 active:scale-95 backdrop-blur-md flex items-center justify-center text-white border border-white/25 transition-all shadow-sm">
              <ArrowsClockwise size={24} weight="bold" />
            </div>
            <span className="text-sm font-normal text-white/90 text-center leading-tight">
              Mi Ruta
            </span>
          </Link>

          {/* Acción 3: Recursos */}
          <Link to="/app/recursos" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/25 active:scale-95 backdrop-blur-md flex items-center justify-center text-white border border-white/25 transition-all shadow-sm">
              <ListBullets size={24} weight="bold" />
            </div>
            <span className="text-sm font-normal text-white/90 text-center leading-tight">
              Recursos
            </span>
          </Link>

          {/* Acción 4: Mi Familia */}
          <Link to="/app/familia" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/25 active:scale-95 backdrop-blur-md flex items-center justify-center text-white border border-white/25 transition-all shadow-sm">
              <UsersThree size={26} weight="bold" />
            </div>
            <span className="text-sm font-normal text-white/90 text-center leading-tight">
              Familia
            </span>
          </Link>
        </div>
      </section>

      {/* 2. Contenido Inferior Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-8 space-y-6 relative z-20 shadow-lg">
        {/* Banner Informativo Negro con Texto Blanco e Interactivo */}
        <button
          type="button"
          onClick={() => setIsAppointmentSheetOpen(true)}
          className="w-full text-left p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-md hover:bg-zinc-900 active:scale-[0.99] transition-all flex items-start gap-3.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 mt-0.5 border border-white/20">
            <Info size={20} weight="bold" className="text-white" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Tu próxima atención está programada
              </p>
              <CaretRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Jueves 18 de Agosto · 09:30 AM en INSN San Borja. Toca para ver detalles o coordinar.
            </p>
          </div>
        </button>

        {/* Sección: Último Proceso (Ultra Minimalista) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Último Proceso
            </h2>
            <Link
              to="/app/citas"
              className="text-sm font-normal text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              <span>Ver ruta</span>
              <CaretRight size={14} />
            </Link>
          </div>

          <Link
            to="/app/citas"
            className="block p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition-colors space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Mateo Quintanilla
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tele-interconsulta · INSN San Borja
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                Paso 2 de 4
              </span>
            </div>

            {/* Barra de progreso de 4 segmentos minimalista */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <div className="h-1.5 rounded-full bg-primary" />
              <div className="h-1.5 rounded-full bg-primary" />
              <div className="h-1.5 rounded-full bg-muted" />
              <div className="h-1.5 rounded-full bg-muted" />
            </div>
          </Link>
        </section>

        {/* Sección: Recursos Recomendados (Tarjetas con Portada Real) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Aprende con Nosotros
            </h2>
            <Link
              to="/app/recursos"
              className="text-sm font-normal text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              <span>Ver todos</span>
              <CaretRight size={14} />
            </Link>
          </div>

          {/* Carrusel Horizontal con Imágenes */}
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 snap-x">
            {FEATURED_RESOURCES.map((resource) => (
              <Link
                key={resource.id}
                to="/app/recursos"
                className="shrink-0 w-48 snap-start rounded-2xl bg-card border border-border/80 overflow-hidden hover:border-primary/40 transition-all flex flex-col group"
              >
                {/* Portada */}
                <div
                  className="h-28 w-full bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${resource.image}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-sm font-medium text-white/90">
                    {resource.readTime}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                  <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-muted-foreground pt-1">
                    {resource.category}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Sección: Agendamiento Rápido de Cita (Limpio) */}
        <section className="pt-1">
          <Link
            to="/app/salud"
            className="p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition-all flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CalendarCheck size={22} weight="regular" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground">
                  Agendar Evaluación CRED
                </h3>
                <p className="text-sm text-muted-foreground">
                  Programa tu próximo control de neurodesarrollo
                </p>
              </div>
            </div>
            <CaretRight size={18} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </section>
      </div>

      {/* 3. Bottom Sheet de Selección de Idioma */}
      <Sheet open={isLanguageSheetOpen} onOpenChange={setIsLanguageSheetOpen}>
        <SheetContent
          side="bottom"
          className="pb-8 pt-4 space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Indicador de arrastre */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-base font-semibold text-foreground">
              Seleccionar Idioma
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Elige el idioma preferido para los contenidos de la aplicación.
            </SheetDescription>
          </SheetHeader>

          {/* Lista de Idiomas */}
          <div className="space-y-2 pt-1">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.id

              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.id)
                    setIsLanguageSheetOpen(false)
                  }}
                  className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] ${isSelected
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "hover:bg-muted text-foreground border border-border/70"
                    }`}
                >
                  <div className="text-left">
                    <p className={`text-base ${isSelected ? "font-semibold text-primary" : "font-medium text-foreground"}`}>
                      {lang.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
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

      {/* 4. Bottom Sheet de Detalles de la Próxima Atención */}
      <Sheet open={isAppointmentSheetOpen} onOpenChange={setIsAppointmentSheetOpen}>
        <SheetContent
          side="bottom"
          className="pb-8 pt-4 space-y-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Indicador de arrastre */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

          <SheetHeader className="text-left space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-medium">
                Cita Confirmada
              </span>
              <span className="text-sm text-muted-foreground">
                Código: #RIS-2026-891
              </span>
            </div>
            <SheetTitle className="text-lg font-bold text-foreground">
              Evaluación Especializada 360°
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Tele-interconsulta y derivación con el Instituto Nacional de Salud del Niño San Borja.
            </SheetDescription>
          </SheetHeader>

          {/* Detalles estructurados */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Hospital size={20} weight="regular" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    INSN San Borja · Neuropediatría
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Dra. Marcela Valdivia (Especialista asignada)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CalendarBlank size={20} weight="regular" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Jueves 18 de Agosto, 2026
                  </p>
                  <p className="text-sm text-muted-foreground">
                    09:30 AM (Llegar 15 min antes)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin size={20} weight="regular" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Consultorio 304 (Piso 3)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Av. Javier Prado Este 3101, Lima
                  </p>
                </div>
              </div>
            </div>

            {/* Requisitos y recordatorios */}
            <div className="p-4 rounded-2xl bg-muted/25 border border-border/70 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Documentos requeridos:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>DNI físico del menor y del apoderado.</li>
                <li>Carné de control CRED y cartilla de vacunación.</li>
                <li>Hojas de tamizaje M-CHAT-R completadas.</li>
              </ul>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="space-y-2 pt-2">
            <Link
              to="/app/citas"
              onClick={() => setIsAppointmentSheetOpen(false)}
              className="w-full py-3.5 px-4 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.99] text-center"
            >
              <span>Ver seguimiento en Mi Ruta</span>
              <CaretRight size={16} />
            </Link>

            <a
              href="tel:113"
              className="w-full py-3 px-4 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] border border-border/70"
            >
              <PhoneCall size={18} weight="regular" />
              <span>Llamar a Central Minsa (113)</span>
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
