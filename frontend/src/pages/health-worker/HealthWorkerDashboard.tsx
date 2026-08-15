import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Baby,
  CheckCircle,
  WarningCircle,
  CaretRight,
  Check,
  X,
  ShieldCheck,
  PaperPlaneRight,
} from "@phosphor-icons/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useCase } from "@/context/CaseContext"

interface Question {
  id: number
  question: string
  detail: string
  critical: boolean
}

const MCHAT_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "¿Si usted señala algo al otro lado de la habitación, su hijo/a lo mira?",
    detail: "Por ejemplo, si señala un juguete o un animal, ¿mira hacia el objeto señalado?",
    critical: true,
  },
  {
    id: 2,
    question: "¿Alguna vez se ha preguntado si su hijo/a tiene problemas de audición?",
    detail: "Evalúa si responde adecuadamente a sonidos o a su nombre.",
    critical: false,
  },
  {
    id: 3,
    question: "¿Su hijo/a juega a simular o hacer como si...?",
    detail: "Por ejemplo, fingir que bebe de una taza vacía o hablar por teléfono.",
    critical: true,
  },
  {
    id: 4,
    question: "¿A su hijo/a le gusta trepar y subirse a los muebles o escaleras?",
    detail: "Evalúa iniciativa motora gruesa y exploración del espacio.",
    critical: false,
  },
  {
    id: 5,
    question: "¿Hace su hijo/a movimientos inusuales con los dedos cerca de sus ojos?",
    detail: "Por ejemplo, aletear los dedos cerca de los ojos de forma repetitiva.",
    critical: true,
  },
]

export function HealthWorkerDashboard() {
  const navigate = useNavigate()
  const { patients, addScreeningResult, submitReferral } = useCase()

  // Control del Sheet de Tamizaje Rápido Inmersivo
  const [isScreeningSheetOpen, setIsScreeningSheetOpen] = useState(false)
  const [screeningStep, setScreeningStep] = useState<1 | 2 | 3>(1)

  // Datos del paciente a evaluar
  const [childName, setChildName] = useState("Joaquín Delgado Paz")
  const [childAge, setChildAge] = useState<number>(18)
  const [childDni, setChildDni] = useState("79451203")
  const [guardianName, setGuardianName] = useState("Camila Paz (Madre)")

  // Cuestionario
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  const resetScreening = () => {
    setScreeningStep(1)
    setCurrentQIndex(0)
    setAnswers({})
    setCreatedPatientId(null)
    setReferralCode(null)
  }

  const handleAnswer = (val: boolean) => {
    const qId = MCHAT_QUESTIONS[currentQIndex].id
    const nextAnswers = { ...answers, [qId]: val }
    setAnswers(nextAnswers)

    if (currentQIndex < MCHAT_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1)
    } else {
      // Cálculo clínico
      const fails = Object.entries(nextAnswers).filter(([key, value]) => {
        const id = Number(key)
        if (id === 2 || id === 5) return value === true
        return value === false
      }).length

      const calculatedRisk = fails >= 2 ? "alto" : fails === 1 ? "medio" : "bajo"
      const newId = addScreeningResult(
        {
          name: childName,
          ageMonths: childAge,
          dni: childDni,
          guardian: guardianName,
          origin: "C.S. San Juan de Miraflores",
        },
        nextAnswers,
        calculatedRisk
      )
      setCreatedPatientId(newId)
      setScreeningStep(3)
    }
  }

  const handleDirectReferral = () => {
    if (!createdPatientId) return
    const code = submitReferral({
      patientId: createdPatientId,
      findings: ["Falta de respuesta al nombre", "Ausencia de juego simbólico"],
      priority: "alta",
      notes: "Tamizaje M-CHAT en CRED con alertas críticas en comunicación temprana.",
      targetCenter: "INSN San Borja - Neuropediatría",
    })
    setReferralCode(code)
  }

  // Cálculo de resultado para el paso 3
  const failsCount = Object.entries(answers).filter(([k, v]) => {
    const id = Number(k)
    if (id === 2 || id === 5) return v === true
    return v === false
  }).length
  const finalRisk = failsCount >= 2 ? "alto" : failsCount === 1 ? "medio" : "bajo"

  return (
    <div className="-mx-4 -mt-4 flex flex-col min-h-screen bg-background">
      {/* 1. Hero Superior Inmersivo con Imagen y Gradiente */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786779602/800w-ef9eLH9Ric4_baa0yk.webp')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/65 pointer-events-none" />

        {/* Barra Superior Espaciadora */}
        <div className="flex items-center justify-between relative z-10 h-20" />

        {/* Sección Central del Hero */}
        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            C.S. San Juan de Miraflores
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Tamizaje CRED
          </h1>
          <p className="text-sm font-normal text-white/80">
            Detección temprana del neurodesarrollo en primera infancia
          </p>
        </div>
      </section>

      {/* 2. Contenido Inferior Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-8 space-y-6 relative z-20 shadow-lg flex-1">
        {/* Banner de Acción Rápida: Iniciar Nuevo Tamizaje (Abre el Sheet Interactivo) */}
        <section>
          <button
            type="button"
            onClick={() => {
              resetScreening()
              setIsScreeningSheetOpen(true)
            }}
            className="w-full p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 flex items-center justify-between shadow-md hover:bg-zinc-900 active:scale-[0.99] transition-all text-left group cursor-pointer"
          >
            <div className="space-y-1 pr-2">
              <h2 className="text-base font-semibold text-white">
                Iniciar Nuevo Tamizaje CRED
              </h2>
              <p className="text-sm font-normal text-zinc-300 leading-snug">
                5 preguntas táctiles rápidas con cálculo automático de riesgo y derivación directa.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform border border-white/20">
              <Plus size={20} weight="bold" />
            </div>
          </button>
        </section>

        {/* Métricas Diarias Limpias */}
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-foreground">
            Resumen del Turno
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-center space-y-0.5 shadow-sm">
              <p className="text-2xl font-bold text-foreground">{patients.length}</p>
              <p className="text-xs font-medium text-muted-foreground">Evaluados</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-center space-y-0.5 shadow-sm">
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {patients.filter((p) => p.riskLevel === "alto").length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">En Alerta</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-center space-y-0.5 shadow-sm">
              <p className="text-2xl font-bold text-foreground">
                {patients.filter((p) => p.status === "derivado").length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Derivados</p>
            </div>
          </div>
        </section>

        {/* Lista de Pacientes Sincronizada con el Estado Global */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Pacientes Evaluados
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              {patients.length} registros
            </span>
          </div>

          <div className="space-y-2">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/app/salud/tamizaje/${patient.id}`)}
                className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between gap-3 hover:border-zinc-900 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-white flex items-center justify-center shrink-0 border border-border">
                    <Baby size={22} weight="regular" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {patient.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {patient.ageDisplay} · DNI {patient.dni}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold border ${patient.riskLevel === "alto"
                        ? "bg-rose-950/10 text-rose-700 dark:text-rose-500 border-rose-600/30"
                        : patient.riskLevel === "medio"
                          ? "bg-amber-950/10 text-amber-700 dark:text-amber-500 border-amber-600/30"
                          : "bg-emerald-950/10 text-emerald-700 dark:text-emerald-500 border-emerald-600/30"
                        }`}
                    >
                      {patient.riskLevel === "alto" && <WarningCircle size={12} weight="fill" />}
                      {patient.riskLevel === "bajo" && <CheckCircle size={12} weight="fill" />}
                      <span>{patient.riskLabel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-0.5">{patient.lastUpdate}</p>
                  </div>
                  <CaretRight size={16} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 3. Bottom Sheet de Tamizaje Rápido Inmersivo (El flujo interactivo fluido) */}
      <Sheet open={isScreeningSheetOpen} onOpenChange={setIsScreeningSheetOpen}>
        <SheetContent side="bottom" className="pb-8 pt-4 space-y-4 max-h-[92vh] overflow-y-auto">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

          {/* PASO 1: Identificación Rápida */}
          {screeningStep === 1 && (
            <div className="space-y-4">
              <SheetHeader className="text-left space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Paso 1 de 3 · Identificación
                </p>
                <SheetTitle className="text-2xl font-semibold text-foreground">
                  Identificación del Niño(a)
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  Ingresa los datos para adaptar el instrumento de evaluación CRED.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Nombres y Apellidos
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      DNI
                    </label>
                    <input
                      type="text"
                      value={childDni}
                      onChange={(e) => setChildDni(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Edad (Meses)
                    </label>
                    <input
                      type="number"
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Madre / Cuidador
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setScreeningStep(2)}
                  className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-md mt-4"
                >
                  <span>Comenzar Cuestionario (5 Preguntas)</span>
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Preguntas Táctiles Rápidas */}
          {screeningStep === 2 && (
            <div className="space-y-4">
              <SheetHeader className="text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Pregunta {currentQIndex + 1} de {MCHAT_QUESTIONS.length}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {childName} ({childAge} meses)
                  </span>
                </div>
                {/* Barra de progreso sutil */}
                <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-950 dark:bg-zinc-100 h-full transition-all duration-300"
                    style={{ width: `${((currentQIndex + 1) / MCHAT_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </SheetHeader>

              <div className="p-4 rounded-2xl bg-card border border-border space-y-2 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground leading-snug">
                  {MCHAT_QUESTIONS[currentQIndex].question}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {MCHAT_QUESTIONS[currentQIndex].detail}
                </p>
              </div>

              {/* Botones de respuesta ergonómicos sobrios */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleAnswer(true)}
                  className="h-14 rounded-2xl border border-border bg-card hover:bg-muted active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-foreground font-medium text-sm"
                >
                  <Check size={18} weight="bold" />
                  <span>SÍ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnswer(false)}
                  className="h-14 rounded-2xl border border-border bg-card hover:bg-muted active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-foreground font-medium text-sm"
                >
                  <X size={18} weight="bold" />
                  <span>NO</span>
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Resultado Inmediato y Derivación Directa */}
          {screeningStep === 3 && (
            <div className="space-y-4">
              <SheetHeader className="text-left space-y-1">
                <SheetTitle className="text-2xl font-semibold text-foreground">
                  Resultado del Tamizaje
                </SheetTitle>
              </SheetHeader>

              {referralCode ? (
                <div className="p-5 rounded-3xl bg-zinc-950 text-white border border-zinc-800 space-y-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/15 text-white border border-white/20 flex items-center justify-center mx-auto">
                    <CheckCircle size={24} weight="fill" />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    Derivación Emitida Exitosamente
                  </h3>
                  <div className="py-1.5 px-3 rounded-lg bg-white/10 text-white font-mono font-bold text-base inline-block border border-white/10 tracking-wider">
                    {referralCode}
                  </div>
                  <p className="text-xs text-zinc-300">
                    Sincronizado con Neuropediatría del INSN San Borja y la hoja de ruta familiar.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setIsScreeningSheetOpen(false)
                      navigate("/app/clinico")
                    }}
                    className="w-full h-11 rounded-xl bg-white text-zinc-950 font-semibold text-sm mt-2 active:scale-[0.98] transition-all"
                  >
                    Ver en Bandeja de Especialista
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} weight="fill" className="text-white" />
                      <span className="text-sm font-semibold text-white">
                        {finalRisk === "alto" ? "Requiere Derivación Temprana" : "Desarrollo Acorde a la Edad"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {finalRisk === "alto"
                        ? "Se detectaron alertas en reciprocidad social o lenguaje. Se sugiere emitir derivación a INSN San Borja."
                        : "Hitos adecuados para la edad cronológica. Continuar en control CRED habitual."}
                    </p>
                  </div>

                  {/* Aviso ético con excelente contraste y tipografía proporcionada */}
                  <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-foreground shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Orientación preventiva para atención primaria, no constituye diagnóstico clínico definitivo.
                    </span>
                  </div>

                  {finalRisk === "alto" ? (
                    <button
                      type="button"
                      onClick={handleDirectReferral}
                      className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-md"
                    >
                      <PaperPlaneRight size={16} weight="fill" />
                      <span>Emitir Derivación Inmediata (INSN SB)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsScreeningSheetOpen(false)}
                      className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-md"
                    >
                      Guardar y Finalizar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
