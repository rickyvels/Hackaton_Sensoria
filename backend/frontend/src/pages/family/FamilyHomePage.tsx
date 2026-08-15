import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  CaretRight,
  Play,
  PhoneCall,
  Heartbeat,
  ShieldCheck,
  Check,
  Compass,
} from "@phosphor-icons/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

export function FamilyHomePage() {
  const navigate = useNavigate()
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [activityCompleted, setActivityCompleted] = useState(false)

  return (
    <div className="-mx-4 -mt-4 flex flex-col min-h-screen bg-background">
      {/* 1. Hero Superior Idéntico a las demás pantallas */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786782196/images_kwu9oi.jpg')`,
        }}
      >
        {/* Capa Gradiente de arriba hacia abajo (Transparente a Negro 60%) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Barra Superior Espaciadora */}
        <div className="flex items-center justify-between relative z-10 h-20" />

        {/* Sección Central Destacada (Texto centrado, tipografía uniforme) */}
        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            Acompañamiento Familiar
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Familia Jimenez
          </h1>
          <p className="text-sm font-normal text-white/80">
            Mateo Jimenez · 18 meses
          </p>
        </div>
      </section>

      {/* 2. Contenido Inferior Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-8 space-y-6 relative z-20 flex-1">
        {/* Banner Informativo Negro Minimalista e Interactivo: Conecta a Mi Ruta */}
        <button
          type="button"
          onClick={() => navigate("/app/familia/ruta")}
          className="w-full text-left p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 hover:bg-zinc-900 active:scale-[0.99] transition-all flex items-start gap-3.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 mt-0.5 border border-white/20">
            <Compass size={20} weight="bold" className="text-white" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Tu próxima atención en INSN San Borja
              </p>
              <CaretRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Martes 24 de Febrero · 09:30 AM (Neuropediatría). Toca para ver tu ruta paso a paso.
            </p>
          </div>
        </button>

        {/* Guía de Estimulación en Casa (Día a Día) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Estimulación en Casa
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              Día 4 de 7
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Juego de atención con telas
                </h3>
                <p className="text-xs text-muted-foreground">
                  5 minutos · Fomenta contacto visual y sonrisa compartida
                </p>
              </div>
              {activityCompleted ? (
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 flex items-center gap-1 shrink-0">
                  <Check size={14} weight="bold" />
                  <span>Completado</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-muted text-foreground text-xs font-medium border border-border/70 shrink-0">
                  Pendiente
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Oculta tu rostro con una tela suave y destápate llamando a Mateo por su nombre con expresión alegre para incentivar la anticipación y reciprocidad.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 text-white hover:bg-zinc-900 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm"
              >
                <Play size={16} weight="fill" />
                <span>{activityCompleted ? "Repetir Ejercicio" : "Comenzar Actividad"}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Centro de Salud de Referencia */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Tu Red de Cuidado Local
          </h2>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center shrink-0 border border-border">
                <Heartbeat size={22} weight="regular" className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  C.S. San Juan de Lurigancho
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enfermera responsable: Lic. Rosa Vega
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="tel:113"
                className="flex-1 py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm flex items-center justify-center gap-2 border border-border/70 active:scale-[0.99] transition-all"
              >
                <PhoneCall size={18} weight="regular" />
                <span>Contactar Centro (113)</span>
              </a>

              <Link
                to="/app/recursos"
                className="flex-1 py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm flex items-center justify-center gap-1.5 border border-border/70 active:scale-[0.99] transition-all text-center"
              >
                <span>Ver Más Guías</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Respaldo Comunitario */}
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-border space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-white" />
            <h3 className="text-sm font-semibold text-white">
              Acompañamiento Continuo
            </h3>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Las actividades realizadas en casa se sincronizan con la ficha clínica para tu próxima evaluación con el neuropediatra.
          </p>
        </div>
      </div>

      {/* Modal / Sheet de Actividad de Estimulación */}
      <Sheet open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <SheetContent side="bottom" className="pb-8 pt-4 space-y-4 max-h-[90vh]">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-2xl font-semibold text-foreground">
              Juego de Atención con Telas
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Pautas sencillas de estimulación visual y de reciprocidad social.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>1. Siéntate frente a Mateo a su misma altura en un lugar tranquilo.</p>
            <p>2. Cúbrete la cara con una tela y di: «¿Dónde está mamá/papá?»</p>
            <p>3. Descúbrete sonriendo con entusiasmo diciendo: «¡Aquí está!»</p>
            <p>4. Observa si sonríe o anticipa el momento con la mirada.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActivityCompleted(true)
              setIsActivityModalOpen(false)
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-900 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm"
          >
            <Check size={18} weight="bold" />
            <span>Marcar como Realizado Hoy</span>
          </button>
        </SheetContent>
      </Sheet>
    </div>
  )
}
