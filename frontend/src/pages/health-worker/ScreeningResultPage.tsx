import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  CaretLeft,
  Hospital,
  CheckCircle,
  Check,
  PaperPlaneRight,
} from "@phosphor-icons/react"
import { useCase } from "@/context/CaseContext"

export function ScreeningResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { patients, submitReferral } = useCase()

  const patient = patients.find((p) => p.id === id) || patients[0]

  // Formulario de Derivación
  const [selectedFindings, setSelectedFindings] = useState<string[]>([
    "Falta de respuesta al nombre",
    "Ausencia de juego simbólico",
  ])
  const [priority, setPriority] = useState<"alta" | "media" | "ordinaria">("alta")
  const [targetCenter, setTargetCenter] = useState("INSN San Borja - Neuropediatría")
  const [clinicalNotes, setClinicalNotes] = useState(
    "Madre refiere que a partir de los 16 meses dejó de pronunciar palabras que antes decía y no sostiene contacto visual. Se solicita evaluación multidisciplinaria temprana."
  )
  const [submittedCode, setSubmittedCode] = useState<string | null>(null)

  const ALL_FINDINGS = [
    "Falta de respuesta al nombre",
    "Ausencia de juego simbólico",
    "Movimientos repetitivos / aleteo",
    "Escaso contacto visual sostenido",
    "Regresión en lenguaje hablado",
    "Irritabilidad ante estímulos sensoriales",
  ]

  const toggleFinding = (f: string) => {
    setSelectedFindings((prev) =>
      prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = submitReferral({
      patientId: patient.id,
      findings: selectedFindings,
      priority,
      notes: clinicalNotes,
      targetCenter,
    })
    setSubmittedCode(code)
  }

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
            onClick={() => navigate("/app/salud")}
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white hover:bg-white/25 active:scale-95 transition-all"
            aria-label="Volver"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        </div>

        {/* Sección Central Destacada (Tipografía Canónica) */}
        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            {patient.origin} · DNI {patient.dni}
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            {patient.name}
          </h1>
          <p className="text-sm font-normal text-white/80">
            Edad: {patient.ageDisplay} · Cuidador: {patient.guardian}
          </p>
        </div>
      </section>

      {/* 2. Contenido Solapado */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-12 space-y-6 relative z-20 flex-1">
        {submittedCode ? (
          /* Estado de Referencia Confirmada */
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-md space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/15 text-white border border-white/20 flex items-center justify-center mx-auto">
                <CheckCircle size={28} weight="fill" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Derivación Emitida Exitosamente
              </h2>
              <p className="text-sm text-zinc-400">
                Código de Referencia Digital:
              </p>
              <div className="py-2 px-4 rounded-xl bg-white/10 text-white font-mono font-bold text-lg inline-block border border-white/10 tracking-wider">
                {submittedCode}
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                El caso ahora es visible en la bandeja de Neuropediatría del INSN San Borja y se ha sincronizado con la hoja de ruta de la familia.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/app/clinico"
                className="w-full h-13 rounded-2xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-md"
              >
                <Hospital size={18} />
                <span>Ver Caso en Bandeja Especialista</span>
              </Link>
              <Link
                to="/app/salud"
                className="w-full h-12 rounded-2xl border border-border bg-card text-foreground font-medium text-sm flex items-center justify-center hover:bg-muted active:scale-[0.98] transition-all"
              >
                Volver al Panel de Salud
              </Link>
            </div>
          </div>
        ) : (
          /* Formulario de Derivación Minimalista */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hallazgos Estructurados */}
            <div className="space-y-2">
              <label className="text-md font-semibold text-muted-foreground block">
                Hallazgos clínicos observados
              </label>
              <div className="grid grid-cols-1 gap-2">
                {ALL_FINDINGS.map((finding) => {
                  const isChecked = selectedFindings.includes(finding)
                  return (
                    <button
                      type="button"
                      key={finding}
                      onClick={() => toggleFinding(finding)}
                      className={`p-3 rounded-2xl border text-left text-sm font-normal flex items-center justify-between transition-all ${isChecked
                        ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                        : "bg-card text-foreground border-border hover:bg-muted"
                        }`}
                    >
                      <span>{finding}</span>
                      {isChecked && <Check size={16} weight="bold" className="shrink-0 ml-2" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Prioridad y Centro Receptor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-md font-semibold text-muted-foreground block mb-1">
                  Prioridad
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="alta">Alta (Tele-Interconsulta)</option>
                  <option value="media">Media</option>
                  <option value="ordinaria">Ordinaria</option>
                </select>
              </div>

              <div>
                <label className="text-md font-semibold text-muted-foreground block mb-1">
                  Centro receptor
                </label>
                <input
                  type="text"
                  value={targetCenter}
                  onChange={(e) => setTargetCenter(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            {/* Observaciones Libres */}
            <div>
              <label className="text-md font-semibold text-muted-foreground block mb-1">
                Observaciones y resumen clínico
              </label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-border bg-card text-foreground text-sm font-normal focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none leading-relaxed"
              />
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-md mt-4"
            >
              <PaperPlaneRight size={18} weight="fill" />
              <span>Emitir Derivación a INSN San Borja</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
