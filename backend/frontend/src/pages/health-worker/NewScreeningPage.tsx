import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  CaretLeft,
  CheckCircle,
  Check,
  X,
  Sparkle,
  Hospital,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react"
import { useCase } from "@/context/CaseContext"

interface Question {
  id: number
  question: string
  detail: string
  critical: boolean
}

const SCREENING_QUESTIONS: Question[] = [
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

export function NewScreeningPage() {
  const navigate = useNavigate()
  const { addScreeningResult } = useCase()

  // Paso actual (1: Identificación, 2: Cuestionario, 3: Resultado)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Datos del Paciente
  const [name, setName] = useState("Joaquín Delgado Paz")
  const [dni, setDni] = useState("79451203")
  const [ageMonths, setAgeMonths] = useState<number>(18)
  const [guardian, setGuardian] = useState("Camila Paz (Madre)")
  const [phone, setPhone] = useState("+51 987 654 321")
  const [origin, setOrigin] = useState("C.S. San Juan de Lurigancho")

  // Estado del Cuestionario
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})

  // Resultado
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null)

  const handleAnswer = (value: boolean) => {
    const qId = SCREENING_QUESTIONS[currentQIndex].id
    const nextAnswers = { ...answers, [qId]: value }
    setAnswers(nextAnswers)

    if (currentQIndex < SCREENING_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1)
    } else {
      // Calcular Riesgo clínico
      // Preguntas 1, 3, 4: responder "NO" (false) es falla
      // Preguntas 2, 5: responder "SÍ" (true) es señal de alerta (falla)
      const fails = Object.entries(nextAnswers).filter(([key, val]) => {
        const id = Number(key)
        if (id === 2 || id === 5) return val === true
        return val === false
      }).length

      const calculatedRisk: "bajo" | "medio" | "alto" =
        fails >= 2 ? "alto" : fails === 1 ? "medio" : "bajo"

      const newId = addScreeningResult(
        { name, dni, ageMonths, guardian, phone, origin },
        nextAnswers,
        calculatedRisk
      )
      setCreatedPatientId(newId)
      setStep(3)
    }
  }

  const currentQ = SCREENING_QUESTIONS[currentQIndex]
  const progressPercent = ((currentQIndex + 1) / SCREENING_QUESTIONS.length) * 100

  // Cálculo de resultado para Step 3
  const criticalFails = Object.entries(answers).filter(([k, v]) => {
    const id = Number(k)
    if (id === 2 || id === 5) return v === true
    return v === false
  }).length

  const finalRisk = criticalFails >= 2 ? "alto" : criticalFails === 1 ? "medio" : "bajo"

  return (
    <div className="-mx-4 -mt-4 flex flex-col min-h-screen bg-background">
      {/* 1. Hero Superior Inmersivo Canónico */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786776308/paisaje-monta%C3%B1oso-low-poly-al-amanecer-con-degradados-pastel-en-los-picos-fondo-de-pantalla-para-m%C3%B3vil-experimenta-la-serena-378149134_pfiikg.webp')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Barra Superior con Botón Atrás */}
        <div className="flex items-center justify-between relative z-10 h-20">
          <button
            type="button"
            onClick={() => {
              if (step === 2 && currentQIndex > 0) {
                setCurrentQIndex((prev) => prev - 1)
              } else if (step === 2) {
                setStep(1)
              } else {
                navigate("/app/salud")
              }
            }}
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white hover:bg-white/25 active:scale-95 transition-all"
            aria-label="Volver"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        </div>

        {/* Título Central Destacado (Tipografía Canónica) */}
        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            {step === 1 ? "Identificación del Paciente" : step === 2 ? `M-CHAT-R/F · ${ageMonths} Meses` : "Evaluación Finalizada"}
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            {step === 1 ? "Nuevo Tamizaje CRED" : step === 2 ? "Desarrollo Temprano" : name}
          </h1>
          <p className="text-sm font-normal text-white/80">
            {step === 1 ? "Paso 1 de 3 · Datos Básicos" : step === 2 ? `Pregunta ${currentQIndex + 1} de ${SCREENING_QUESTIONS.length}` : "Resultado y Conducta Clínica"}
          </p>
        </div>

        {/* Barra de Progreso Ultrafina en Paso 2 */}
        {step === 2 && (
          <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden relative z-10 mt-2">
            <div
              className="bg-white h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </section>

      {/* 2. Contenedor Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-12 space-y-6 relative z-20  flex-1">
        {/* PASO 1: Identificación y Selección de Edad */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-1">
              <p className="text-xs text-zinc-400 font-medium">Instrumento Recomendado</p>
              <p className="text-sm font-semibold text-white">M-CHAT-R/F Adaptado (16 a 30 meses)</p>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Seleccionado automáticamente para detección oportuna del neurodesarrollo en CRED.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Nombre Completo del Niño(a)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Ej. Mateo Ramos"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Edad en Meses
                  </label>
                  <input
                    type="number"
                    value={ageMonths}
                    onChange={(e) => setAgeMonths(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Madre / Cuidador Responsable
                </label>
                <input
                  type="text"
                  value={guardian}
                  onChange={(e) => setGuardian(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Establecimiento / Posta de Origen
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-md mt-4"
            >
              <span>Iniciar Cuestionario</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* PASO 2: Cuestionario Interactivo Táctil */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Sparkle size={14} className="text-foreground" />
                <span>Pregunta {currentQIndex + 1} de {SCREENING_QUESTIONS.length}</span>
              </div>
              <h2 className="text-sm font-semibold text-foreground leading-snug">
                {currentQ.question}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentQ.detail}
              </p>
            </div>

            {/* Botones de Respuesta Táctiles Sobrios */}
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

            <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground text-center">
              Pregunta con guardado automático. Puede retroceder en la barra superior si requiere corregir.
            </div>
          </div>
        )}

        {/* PASO 3: Resultado y Enlace a Derivación */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Banner de Resultado Minimalista */}
            <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-1.5 shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-white" />
                <span className="text-sm font-semibold text-white">
                  {finalRisk === "alto" ? "Requiere Derivación Temprana" : "Desarrollo Acorde a la Edad"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {finalRisk === "alto"
                  ? "Se identificaron señales de alerta en comunicación o reciprocidad social. Requiere derivación oportuna al INSN San Borja."
                  : "Hitos acordes a la edad cronológica. Continuar en control CRED habitual."}
              </p>
            </div>

            {/* Aviso ético obligatorio */}
            <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-foreground shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Orientación preventiva para atención primaria, no constituye diagnóstico médico definitivo.
              </span>
            </div>

            {/* Acciones */}
            <div className="space-y-2.5 pt-2">
              {finalRisk === "alto" ? (
                <button
                  type="button"
                  onClick={() => navigate(`/app/salud/tamizaje/${createdPatientId || "pat-1"}`)}
                  className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-md"
                >
                  <Hospital size={16} />
                  <span>Completar Ficha de Derivación (INSN SB)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/app/salud")}
                  className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-md"
                >
                  <span>Finalizar y Volver al Panel</span>
                </button>
              )}

              <Link
                to="/app/salud"
                className="w-full h-11 rounded-xl border border-border bg-card text-foreground font-medium text-sm flex items-center justify-center hover:bg-muted active:scale-[0.98] transition-all"
              >
                Volver a Mis Pacientes
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
