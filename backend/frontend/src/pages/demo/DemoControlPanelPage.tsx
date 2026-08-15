import { useState } from "react"
import { Link } from "react-router-dom"
import {
  CaretRight,
  ArrowsClockwise,
  Play,
  Stethoscope,
  Hospital,
  Heartbeat,
  ShieldCheck,
  Check,
} from "@phosphor-icons/react"

interface DemoStep {
  step: number
  role: string
  title: string
  desc: string
  path: string
  icon: typeof Stethoscope
}

const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    role: "Primer Nivel · Posta CRED",
    title: "1. Tamizaje de Neurodesarrollo",
    desc: "Enfermera detecta señales de alerta M-CHAT-R en Mateo (18 meses) y genera la orden de derivación.",
    path: "/app/salud",
    icon: Stethoscope,
  },
  {
    step: 2,
    role: "Especialista · INSN San Borja",
    title: "2. Tele-Interconsulta & Admisión",
    desc: "Neuropediatra revisa la evidencia en video, valida el caso prioritario y agenda evaluación multidisciplinaria.",
    path: "/app/clinico",
    icon: Hospital,
  },
  {
    step: 3,
    role: "Hogar · Familia",
    title: "3. Acompañamiento & Rutina",
    desc: "Los padres reciben confirmación de cita en tiempo real y pautas de estimulación temprana guiadas.",
    path: "/app/familia",
    icon: Heartbeat,
  },
]

export function DemoControlPanelPage() {
  const [currentStage, setCurrentStage] = useState<number>(1)

  return (
    <div className="-mx-4 -mt-4 flex flex-col">
      {/* 1. Hero Superior Idéntico a las demás pantallas */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786782194/images_y6dcxx.jpg')`,
        }}
      >
        {/* Capa Gradiente de arriba hacia abajo (Transparente a Negro 60%) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Barra Superior Espaciadora */}
        <div className="flex items-center justify-between relative z-10 h-20" />

        {/* Sección Central Destacada (Texto centrado, tipografía uniforme) */}
        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            Simulador del Flujo Clínico
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Demo Pitch 360°
          </h1>
          <p className="text-sm font-normal text-white/80">
            Articulación Primer Nivel · INSN San Borja · Familia
          </p>
        </div>
      </section>

      {/* 2. Contenido Inferior Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-8 space-y-6 relative z-20 shadow-lg">
        {/* Panel de Control de la Demostración */}
        <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Paso Activo de la Demostración
              </p>
              <p className="text-sm text-zinc-300">
                Paso {currentStage} de 3 · {DEMO_STEPS[currentStage - 1].role}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-sm font-medium border border-white/20">
              Paso {currentStage}/3
            </span>
          </div>

          {/* 3 Segmentos de Progreso */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className={`h-1.5 rounded-full transition-all ${currentStage >= 1 ? "bg-white" : "bg-white/20"}`} />
            <div className={`h-1.5 rounded-full transition-all ${currentStage >= 2 ? "bg-white" : "bg-white/20"}`} />
            <div className={`h-1.5 rounded-full transition-all ${currentStage >= 3 ? "bg-white" : "bg-white/20"}`} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCurrentStage((prev) => Math.min(prev + 1, 3))}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white text-black hover:bg-white/90 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <span>Avanzar Paso ({Math.min(currentStage + 1, 3)}/3)</span>
              <CaretRight size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentStage(1)}
              aria-label="Reiniciar flujo"
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm flex items-center justify-center border border-white/20 active:scale-[0.99] transition-all"
            >
              <ArrowsClockwise size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Las 3 Etapas del Ecosistema */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Ruta de Demostración
            </h2>
            <span className="text-sm text-muted-foreground">
              Flujo Interoperable
            </span>
          </div>

          <div className="space-y-3">
            {DEMO_STEPS.map((item) => {
              const isActive = currentStage === item.step
              const isCompleted = currentStage > item.step
              const IconComp = item.icon

              return (
                <div
                  key={item.step}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isActive
                      ? "bg-card border-primary/50 shadow-sm"
                      : isCompleted
                      ? "bg-muted/20 border-border/60 opacity-80"
                      : "bg-card border-border/80 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <IconComp size={22} weight="regular" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {item.role}
                        </span>
                        <h3 className="text-base font-semibold text-foreground">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    {isCompleted ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium border border-emerald-500/20 flex items-center gap-1 shrink-0">
                        <Check size={14} weight="bold" />
                        <span>Listo</span>
                      </span>
                    ) : isActive ? (
                      <span className="px-2.5 py-1 rounded-full bg-black text-white text-sm font-medium shrink-0">
                        En curso
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="pt-1">
                    <Link
                      to={item.path}
                      className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all ${
                        isActive
                          ? "bg-black text-white hover:bg-black/90 shadow-sm"
                          : "bg-muted hover:bg-muted/80 text-foreground border border-border/70"
                      }`}
                    >
                      <Play size={14} weight="fill" />
                      <span>Ver Vista ({item.role.split("·")[0].trim()})</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Respaldo de Impacto */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} weight="regular" className="text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Impacto Clínico Demostrado
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Reduce los tiempos de espera de derivación especializada de 9 meses a 72 horas mediante interoperabilidad digital RIS-MINSA.
          </p>
        </div>
      </div>
    </div>
  )
}
