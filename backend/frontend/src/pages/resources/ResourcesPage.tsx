import { useState } from "react"
import {
  MagnifyingGlass,
  SlidersHorizontal,
  CaretDown,
  Heart,
  Star,
  DownloadSimple,
  WifiSlash,
  CheckCircle,
  Clock,
  Sparkle,
  Check,
  ArrowsCounterClockwise,
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

interface ResourceItem {
  id: string
  title: string
  category: "guias" | "actividades" | "videos" | "rutinas"
  categoryLabel: string
  ageRange: string
  readTime: string
  rating: string
  ratingsCount: number
  location: string
  image: string
  description: string
  summaryPoints: string[]
  isOfflineAvailable?: boolean
  videoUrl?: string
}

const AGE_OPTIONS = [
  { id: "todos", label: "Todas las edades", desc: "Todos los rangos pediátricos" },
  { id: "0-18", label: "0 a 18 meses", desc: "Lactantes y primera estimulación" },
  { id: "18-36", label: "18 a 36 meses", desc: "Primera infancia y lenguaje temprano" },
]

const TYPE_OPTIONS = [
  { id: "todos", label: "Todos los formatos", desc: "Guías, videos y actividades" },
  { id: "actividades", label: "Actividades Interactivas", desc: "Juegos y estimulación en el hogar" },
  { id: "guias", label: "Guías Clínicas MINSA", desc: "Protocolos y manuales de hitos" },
  { id: "rutinas", label: "Rutinas en Casa", desc: "Pautas de calma y regulación sensorial" },
  { id: "videos", label: "Videos Demostrativos", desc: "Tutoriales y señales en video" },
]

const RESOURCES: ResourceItem[] = [
  {
    id: "1",
    title: "Estimulación del lenguaje y juego vocal en casa",
    category: "actividades",
    categoryLabel: "Actividad Interactiva",
    ageRange: "12 - 24 meses",
    readTime: "3 min de lectura",
    rating: "4.98",
    ratingsCount: 142,
    location: "Neuropediatría · INSN San Borja",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80",
    description: "Técnicas lúdicas para estimular la intención comunicativa, imitación de sílabas y señalamiento de objetos cotidianos.",
    summaryPoints: [
      "Juegos frente al espejo con canciones y gestos faciales.",
      "Pausas de 5 segundos para estimular la respuesta vocal del niño.",
      "Uso de libros ilustrados con texturas para nombrar objetos.",
    ],
    isOfflineAvailable: true,
  },
  {
    id: "2",
    title: "Guía de hitos motores y señales de alerta temprana",
    category: "guias",
    categoryLabel: "Guía Clínica MINSA",
    ageRange: "0 - 18 meses",
    readTime: "5 min de lectura",
    rating: "4.95",
    ratingsCount: 208,
    location: "Red de Salud CRED · MINSA",
    image: "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
    description: "Manual ilustrado para padres y personal de salud sobre control de cabeza, sedestación, gateo y marcha simétrica.",
    summaryPoints: [
      "Evaluación del sostén cefálico a partir del tercer mes.",
      "Identificación de postura asimétrica o rigidez en extremidades.",
      "Pautas de consulta oportuna con telemedicina INSN-SB.",
    ],
    isOfflineAvailable: true,
  },
  {
    id: "3",
    title: "Pautas de regulación sensorial y rutinas de calma",
    category: "rutinas",
    categoryLabel: "Rutina Práctica",
    ageRange: "18 - 36 meses",
    readTime: "4 min de lectura",
    rating: "4.92",
    ratingsCount: 96,
    location: "Terapia Ocupacional · INSN-SB",
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80",
    description: "Estrategias para crear espacios de calma en casa, anticipar cambios de ambiente y manejar sensibilidad a ruidos o texturas.",
    summaryPoints: [
      "Armado de un rincón sensorial con almohadas y luz tenue.",
      "Anticipación de actividades mediante tarjetas visuales simples.",
      "Juegos de presión profunda y respiración acompañada.",
    ],
    isOfflineAvailable: true,
  },
  {
    id: "4",
    title: "Video: Hitos de desarrollo a los 3 meses",
    category: "videos",
    categoryLabel: "Video Demostrativo",
    ageRange: "3 meses",
    readTime: "4:30 min video",
    rating: "4.99",
    ratingsCount: 310,
    location: "Sesame Workshop · Fuente institucional",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80",
    description: "Video institucional sobre hitos tempranos, exploración de las manos y juego con sonajas.",
    summaryPoints: [
      "Exploración de las manos y coordinación inicial.",
      "Juego con sonidos sencillos, como una sonaja.",
      "Acompañamiento familiar mediante juego compartido.",
    ],
    isOfflineAvailable: false,
    videoUrl: "https://www.youtube-nocookie.com/embed/q0i4kjB8KhU",
  },
]

export function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAge, setSelectedAge] = useState<string>("todos")
  const [selectedType, setSelectedType] = useState<string>("todos")
  const [onlyOffline, setOnlyOffline] = useState<boolean>(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Record<string, boolean>>({ "1": true })
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null)

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavoriteIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const resetFilters = () => {
    setSelectedAge("todos")
    setSelectedType("todos")
    setOnlyOffline(false)
  }

  const downloadSelectedResource = () => {
    if (!selectedResource) return
    const text = [selectedResource.title, selectedResource.location, "", selectedResource.description, "", ...selectedResource.summaryPoints].join("\n")
    const downloadUrl = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `${selectedResource.id}-ficha-neuroalianza.txt`
    link.click()
    URL.revokeObjectURL(downloadUrl)
  }

  const activeFiltersCount =
    (selectedAge !== "todos" ? 1 : 0) +
    (selectedType !== "todos" ? 1 : 0) +
    (onlyOffline ? 1 : 0)

  const filteredResources = RESOURCES.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAge =
      selectedAge === "todos" ||
      (selectedAge === "0-18" && (res.ageRange.includes("0 - 18") || res.ageRange.includes("12 - 24"))) ||
      (selectedAge === "18-36" && (res.ageRange.includes("18 - 36") || res.ageRange.includes("16 - 30")))
    const matchesType = selectedType === "todos" || res.category === selectedType
    const matchesOffline = !onlyOffline || res.isOfflineAvailable
    return matchesSearch && matchesAge && matchesType && matchesOffline
  })

  return (
    <div className="-mx-4 -mt-4 flex flex-col">
      {/* 1. Hero Superior con Imagen y Capa Gradiente */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786777517/images_3_rmd6xc.jpg')`,
        }}
      >
        {/* Capa Gradiente de arriba hacia abajo (Transparente a Negro 60%) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Barra Superior Espaciadora */}
        <div className="flex items-center justify-between relative z-10 h-20">
        </div>

        {/* Sección Central Destacada */}
        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            Aprende en Familia
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Guías & Recursos
          </h1>
          <p className="text-sm font-normal text-white/80">
            Pautas de estimulación temprana y neurodesarrollo
          </p>
        </div>

        {/* Barra de Búsqueda Translúcida en el Hero */}
        <div className="relative max-w-sm mx-auto z-10">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar artículos, guías o videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white/20 hover:bg-white/25 backdrop-blur-md border border-white/25 text-sm font-normal text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 transition-colors"
          />
        </div>
      </section>

      {/* 2. Contenido Inferior Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-5 pb-8 space-y-5 relative z-20 shadow-lg">
        {/* Fila de Filtros Desplegables Tipo Chip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 snap-x">
          {/* Botón Principal de Filtros */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`shrink-0 h-10 px-3.5 rounded-2xl flex items-center gap-2 text-sm transition-all border ${activeFiltersCount > 0
              ? "bg-primary text-primary-foreground border-primary font-medium"
              : "bg-card text-foreground border-border/80 hover:bg-muted"
              }`}
            aria-label="Abrir panel de filtros"
          >
            <SlidersHorizontal size={18} weight="regular" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-sm font-semibold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Filtro por Edad */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`shrink-0 h-10 px-3.5 rounded-2xl flex items-center gap-1.5 text-sm transition-all border ${selectedAge !== "todos"
              ? "bg-primary/10 text-primary border-primary/30 font-medium"
              : "bg-card text-foreground border-border/80 hover:bg-muted"
              }`}
          >
            <span>
              {selectedAge === "0-18" ? "Edad: 0-18m" : selectedAge === "18-36" ? "Edad: 18-36m" : "Edad"}
            </span>
            <CaretDown size={14} weight="bold" />
          </button>

          {/* Filtro por Tipo */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`shrink-0 h-10 px-3.5 rounded-2xl flex items-center gap-1.5 text-sm transition-all border ${selectedType !== "todos"
              ? "bg-primary/10 text-primary border-primary/30 font-medium"
              : "bg-card text-foreground border-border/80 hover:bg-muted"
              }`}
          >
            <span className="capitalize">
              {selectedType === "todos"
                ? "Tipo de recurso"
                : selectedType === "actividades"
                  ? "Actividades"
                  : selectedType === "guias"
                    ? "Guías"
                    : selectedType === "rutinas"
                      ? "Rutinas"
                      : "Videos"}
            </span>
            <CaretDown size={14} weight="bold" />
          </button>

          {/* Filtro Offline */}
          <button
            type="button"
            onClick={() => setOnlyOffline((prev) => !prev)}
            className={`shrink-0 h-10 px-3.5 rounded-2xl flex items-center gap-1.5 text-sm transition-all border ${onlyOffline
              ? "bg-primary/10 text-primary border-primary/30 font-medium"
              : "bg-card text-muted-foreground border-border/80 hover:bg-muted"
              }`}
          >
            <WifiSlash size={16} />
            <span>Offline</span>
          </button>
        </div>

        {/* Encabezado de Cantidad de Recursos */}
        <div className="pt-1">
          <h2 className="text-lg font-semibold text-foreground">
            {filteredResources.length}+ recursos disponibles
          </h2>
          <p className="text-sm text-muted-foreground">
            Materiales clínicos validados para el neurodesarrollo en primera infancia.
          </p>
        </div>

        {/* Lista de Tarjetas Visuales Grandes */}
        <div className="space-y-4">
          {filteredResources.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-card border border-border/80 rounded-3xl p-6">
              <p className="text-base font-semibold text-foreground">
                No hay recursos con estos filtros
              </p>
              <p className="text-sm text-muted-foreground">
                Prueba cambiando el rango de edad o el formato del recurso.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
              >
                <ArrowsCounterClockwise size={16} />
                <span>Restablecer Filtros</span>
              </button>
            </div>
          ) : (
            filteredResources.map((res, index) => (
              <div key={res.id} className="space-y-4">
                <div
                  onClick={() => setSelectedResource(res)}
                  className="cursor-pointer group block"
                >
                  <Card className="overflow-hidden bg-card border border-border/80 shadow-none hover:border-primary/40 transition-all rounded-3xl">
                    <CardContent className="p-0">
                      {/* Contenedor de Imagen de Portada */}
                      <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                        <img
                          src={res.image}
                          alt={res.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          loading="lazy"
                        />

                        {/* Badge de Categoría Flotante */}
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-sm font-medium border border-white/20">
                          {res.categoryLabel}
                        </div>

                        {/* Botón de Favorito Flotante */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(res.id, e)}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/45 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
                          aria-label="Guardar en favoritos"
                        >
                          <Heart
                            size={18}
                            weight={favoriteIds[res.id] ? "fill" : "regular"}
                            className={favoriteIds[res.id] ? "text-destructive" : "text-white"}
                          />
                        </button>

                        {/* Badge de Rango de Edad */}
                        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-card/90 backdrop-blur-md text-foreground text-sm font-medium border border-border/60">
                          {res.ageRange}
                        </div>
                      </div>

                      {/* Información Detallada Debajo de la Imagen */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {res.title}
                        </h3>

                        {/* Rating y Vistas */}
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <span className="font-semibold">{res.rating}</span>
                          <Star size={14} weight="fill" className="text-primary fill-primary" />
                          <span className="text-muted-foreground">({res.ratingsCount} familias)</span>
                        </div>

                        {/* Ubicación / Especialidad */}
                        <p className="text-sm text-muted-foreground">
                          {res.location}
                        </p>

                        {/* Barra Inferior: Tiempo de lectura y Botón de Apertura */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock size={14} />
                            {res.readTime}
                          </span>
                          <span className="font-semibold text-primary group-hover:underline">
                            Ver Ficha Completa
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Banner Informativo Entre Tarjetas */}
                {index === 0 && (
                  <div className="p-4 rounded-3xl bg-muted/50 border border-border/80 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        Acceso sin conexión activado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Puedes consultar todas estas fichas aunque no tengas señal en tu posta.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Sparkle size={22} weight="regular" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Bottom Sheet de Filtros Avanzados */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="pb-8 pt-4 space-y-5 max-h-[88vh] overflow-y-auto"
        >
          {/* Barra de agarre superior */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

          {/* Encabezado del Bottomsheet */}
          <div className="flex items-center justify-between">
            <SheetHeader className="text-left space-y-0.5">
              <SheetTitle className="text-lg font-semibold text-foreground">
                Filtros de Recursos
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Personaliza las fichas y guías según la edad y formato.
              </SheetDescription>
            </SheetHeader>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                <ArrowsCounterClockwise size={14} />
                <span>Restablecer</span>
              </button>
            )}
          </div>

          {/* Sección 1: Rango de Edad */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Rango de Edad del Paciente
            </p>
            <div className="space-y-1.5">
              {AGE_OPTIONS.map((opt) => {
                const isSelected = selectedAge === opt.id

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedAge(opt.id)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all border ${isSelected
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-card text-foreground border-border/70 hover:bg-muted"
                      }`}
                  >
                    <div>
                      <p className={`text-sm ${isSelected ? "font-semibold text-primary" : "font-normal text-foreground"}`}>
                        {opt.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <Check size={14} weight="bold" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sección 2: Tipo de Contenido */}
          <div className="space-y-2 pt-1">
            <p className="text-sm font-semibold text-foreground">
              Tipo de Contenido y Formato
            </p>
            <div className="space-y-1.5">
              {TYPE_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.id

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedType(opt.id)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all border ${isSelected
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-card text-foreground border-border/70 hover:bg-muted"
                      }`}
                  >
                    <div>
                      <p className={`text-sm ${isSelected ? "font-semibold text-primary" : "font-normal text-foreground"}`}>
                        {opt.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <Check size={14} weight="bold" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Botón de Aplicar Filtros */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(false)}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-sm"
            >
              <span>Aplicar Filtros ({filteredResources.length} resultados)</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. Bottom Sheet de Detalle del Recurso */}
      <Sheet
        open={Boolean(selectedResource)}
        onOpenChange={(open) => !open && setSelectedResource(null)}
      >
        <SheetContent
          side="bottom"
          className="pb-8 pt-4 space-y-4 max-h-[85vh] overflow-y-auto"
        >
          {/* Barra de arrastre */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

          {selectedResource && (
            <div className="space-y-4">
              <SheetHeader className="text-left space-y-1">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <span>{selectedResource.categoryLabel}</span>
                  <span>·</span>
                  <span>{selectedResource.ageRange}</span>
                </div>
                <SheetTitle className="text-lg font-semibold text-foreground">
                  {selectedResource.title}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  {selectedResource.description}
                </SheetDescription>
              </SheetHeader>

              {/* Puntos clave */}
              {selectedResource.videoUrl && navigator.onLine && (
                <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
                  <iframe className="h-full w-full" src={selectedResource.videoUrl} title={selectedResource.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              )}
              {selectedResource.videoUrl && !navigator.onLine && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  El video no está disponible sin conexión. Guarda la ficha para conservar las recomendaciones.
                </div>
              )}
              <div className="space-y-2 pt-1">
                <p className="text-sm font-semibold text-foreground">
                  Puntos Clave para la Familia
                </p>
                <div className="space-y-2">
                  {selectedResource.summaryPoints.map((point, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-muted/50 border border-border/60 flex items-start gap-2.5"
                    >
                      <CheckCircle
                        size={18}
                        className="text-primary shrink-0 mt-0.5"
                        weight="regular"
                      />
                      <p className="text-sm text-foreground leading-relaxed">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de Descarga */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={downloadSelectedResource}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-sm"
                >
                  <DownloadSimple size={18} weight="bold" />
                  <span>Guardar Ficha en Mi Dispositivo</span>
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
