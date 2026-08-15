import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CaretLeft,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react"

interface RoadmapStep {
  id: number
  title: string
  subtitle: string
  description: string
  duration: string
  status: "completado" | "actual" | "siguiente"
  date?: string
}

const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 1,
    title: "1. Detección Temprana en Posta CRED",
    subtitle: "C.S. San Juan de Lurigancho",
    description:
      "Evaluación inicial del desarrollo y aplicación de señales de alarma. Se generó la referencia prioritaria.",
    duration: "Completado el 05 de Agosto",
    status: "completado",
    date: "05 Ago, 2026",
  },
  {
    id: 2,
    title: "2. Tele-Interconsulta y Admisión",
    subtitle: "INSN San Borja · Neuropediatría",
    description:
      "Revisión multidisciplinaria del caso y asignación de cupo preferente para inicio de evaluación diagnóstica.",
    duration: "Completado el 12 de Agosto",
    status: "completado",
    date: "12 Ago, 2026",
  },
  {
    id: 3,
    title: "3. Evaluación Multidisciplinaria Presencial",
    subtitle: "Consultorio 304 · INSN San Borja",
    description:
      "Sesión clínica integral con Neuropediatría, Psicología y Terapia de Lenguaje. Recuerde llevar el carné CRED.",
    duration: "Próximo: Martes 24 de Febrero · 09:30 AM",
    status: "actual",
    date: "En curso",
  },
  {
    id: 4,
    title: "4. Plan Terapéutico y Actividades en Casa",
    subtitle: "Acompañamiento Continuo",
    description:
      "Diseño del plan de intervención personalizado y ejercicios guiados para realizar con la familia en el hogar.",
    duration: "Estimado: 2 a 4 semanas después",
    status: "siguiente",
  },
  {
    id: 5,
    title: "5. Contrarreferencia y Seguimiento Local",
    subtitle: "Retorno al Centro de Salud de Origen",
    description:
      "Coordinación con el centro de salud de su comunidad para controles mensuales de avance sin viajes innecesarios.",
    duration: "Fase final continua",
    status: "siguiente",
  },
]

export function FamilyRoadmapPage() {
  const navigate = useNavigate()
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false)
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<string | null>(null)
  const [declineSubmitted, setDeclineSubmitted] = useState(false)

  const DECLINE_REASONS = [
    "Dificultad de transporte / Pasaje",
    "Horario laboral no flexible",
    "Motivos de salud del niño o familiar",
    "Distancia geográfica desde provincia",
    "Otro motivo",
  ]

  return (
    <div className="-mx-4 -mt-4 flex flex-col min-h-screen bg-background">
      {/* 1. Hero Superior Inmersivo Canónico */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786782196/images_kwu9oi.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Barra Superior con Botón Atrás */}
        <div className="flex items-center justify-between relative z-10 h-20">
          <button
            type="button"
            onClick={() => navigate("/app/familia")}
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white hover:bg-white/25 active:scale-95 transition-all"
            aria-label="Volver"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        </div>

        {/* Sección Central Destacada (Tipografía Canónica) */}
        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            Familia Jimenez · Mateo (18 meses)
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Mi Ruta de Atención
          </h1>
          <p className="text-sm font-normal text-white/80">
            Paso 3 de 5 · Revisión por Neuropediatría
          </p>
        </div>
      </section>

      {/* 2. Contenedor Solapado */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-12 space-y-6 relative z-20 flex-1">
        {/* Banner Explicativo Minimalista */}
        <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-1">
          <p className="text-xs text-zinc-400 font-medium">¿Cómo funciona esta ruta?</p>
          <p className="text-sm font-semibold text-white">Cada paso tiene un propósito claro</p>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Te mostramos el camino completo para que sepas qué esperar en cada etapa y nunca sientas que estás esperando a ciegas.
          </p>
        </div>

        {/* Línea de Tiempo Vertical */}
        <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-border before:z-0">
          {ROADMAP_STEPS.map((step) => {
            const isCompleted = step.status === "completado"
            const isCurrent = step.status === "actual"
            const isNext = step.status === "siguiente"

            return (
              <div key={step.id} className="relative z-10 pl-9 space-y-1.5 group">
                {/* Icono / Indicador de Paso */}
                <div
                  className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    isCompleted
                      ? "bg-zinc-950 text-white border-zinc-950"
                      : isCurrent
                        ? "bg-zinc-950 text-white border-zinc-900 ring-4 ring-zinc-900/10"
                        : "bg-background text-zinc-400 border-border"
                  }`}
                >
                  {isCompleted ? <CheckCircle size={18} weight="fill" /> : step.id}
                </div>

                {/* Tarjeta del Paso */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-card border-zinc-950 shadow-md ring-1 ring-zinc-950/20"
                      : isCompleted
                        ? "bg-card/70 border-border/70"
                        : "bg-muted/40 border-border/40 opacity-75"
                  }`}
                >
                  <div className="flex flex-col items-start justify-between gap-2">
                    {isCurrent && (
                      <span className="text-xs font-normal tracking-wider px-2 py-0.5 rounded-full bg-zinc-950 text-white">
                        Paso Actual
                      </span>
                    )}
                    <h3 className={`text-sm font-semibold ${isNext ? "text-muted-foreground" : "text-foreground"}`}>
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs font-medium text-zinc-500 mt-0.5">
                    {step.subtitle}
                  </p>

                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    {step.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{step.duration}</span>
                    </div>
                  </div>

                  {/* Acciones si es el paso actual de la cita */}
                  {isCurrent && (
                    <div className="mt-3.5 pt-3 border-t border-border flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate("/app/citas")}
                        className="flex-1 h-10 rounded-xl bg-zinc-950 text-white text-sm font-medium hover:bg-zinc-900 active:scale-[0.98] transition-all"
                      >
                        Ver Detalles de Cita
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeclineModalOpen(true)}
                        className="px-3 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.98] transition-all"
                      >
                        No podré asistir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal / Sheet Minimalista de Inasistencia con Causa */}
        {isDeclineModalOpen && (
          <div className="p-5 rounded-3xl bg-zinc-950 text-white border border-zinc-800 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">
                ¿Por qué no podrás asistir a esta cita?
              </h3>
              <p className="text-xs text-zinc-400">
                Tu respuesta nos ayuda a coordinar un nuevo horario o brindarte facilidades sin perder tu lugar de atención.
              </p>
            </div>

            {declineSubmitted ? (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 text-center space-y-2">
                <CheckCircle size={24} weight="fill" className="text-white mx-auto" />
                <p className="text-sm font-semibold text-white">
                  Aviso registrado correctamente
                </p>
                <p className="text-xs text-zinc-300">
                  El equipo de admisión se comunicará por WhatsApp al +51 984 123 456 para reprogramar tu atención.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeclineModalOpen(false)
                    setDeclineSubmitted(false)
                  }}
                  className="mt-2 text-xs text-zinc-300 hover:text-white underline"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {DECLINE_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedDeclineReason(reason)}
                    className={`w-full p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                      selectedDeclineReason === reason
                        ? "bg-white text-zinc-950 border-white font-semibold"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850"
                    }`}
                  >
                    {reason}
                  </button>
                ))}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={!selectedDeclineReason}
                    onClick={() => setDeclineSubmitted(true)}
                    className="flex-1 h-11 rounded-xl bg-white text-zinc-950 font-medium text-sm disabled:opacity-40 hover:bg-zinc-100 active:scale-[0.98] transition-all"
                  >
                    Confirmar Aviso y Reprogramar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeclineModalOpen(false)}
                    className="px-4 h-11 rounded-xl border border-zinc-800 text-sm text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
