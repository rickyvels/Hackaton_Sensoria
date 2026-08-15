import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  UserCheck,
  CheckCircle,
  ShieldCheck,
  Check,
  ChartBar,
  CaretRight,
  FileText,
} from "@phosphor-icons/react"
import { useCase } from "@/context/CaseContext"

export function SpecialistDashboard() {
  const navigate = useNavigate()
  const { patients, updatePatientStatus } = useCase()
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const handleAdmit = (patientId: string) => {
    updatePatientStatus(patientId, "cita_programada", "Cita Neuropediatría Asignada")
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const admittedCount = patients.filter((p) => p.status === "cita_programada" || p.status === "en_evaluacion").length

  return (
    <div className="-mx-4 -mt-4 flex flex-col min-h-screen bg-background">
      {/* 1. Hero Superior Idéntico: Espaciador h-20, py-14 centrado */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786781319/212485521-color-azul-rojo-oscuro-degradado-para-fondos-de-pantalla-o-fondos-de-escritorio_kzf24q.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />
        <div className="flex items-center justify-between relative z-10 h-20" />

        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            INSN San Borja
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Tele-interconsulta 360°
          </h1>
          <p className="text-sm font-normal text-white/80">
            Admisión y coordinación con especialistas de neuropediatría
          </p>
        </div>
      </section>

      {/* 2. Contenido Inferior Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-8 space-y-6 relative z-20 shadow-lg flex-1">
        {/* Notificación de admisión */}
        {showSuccessToast && (
          <div className="p-3.5 rounded-2xl bg-zinc-950 text-white flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border border-zinc-800">
            <CheckCircle size={22} weight="fill" className="text-white shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Paciente Admitido</p>
              <p className="text-sm text-zinc-300">Cita 360° coordinada con el centro de salud de origen.</p>
            </div>
          </div>
        )}

        {/* Acceso a Métricas de Red Minimalista */}
        <button
          type="button"
          onClick={() => navigate("/app/clinico/metricas")}
          className="w-full p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 flex items-center justify-between hover:bg-zinc-900 active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <ChartBar size={22} weight="bold" className="text-white" />
            </div>
            <div className="text-left space-y-0.5">
              <p className="text-sm font-semibold text-white">Panel de Métricas de Red</p>
              <p className="text-sm text-zinc-400">Tiempos de espera y causas de inasistencia</p>
            </div>
          </div>
          <CaretRight size={18} className="text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Resumen del Turno Clínico - Minimalista */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-0.5 shadow-sm">
            <p className="text-xl font-bold text-foreground">{patients.length}</p>
            <p className="text-sm text-muted-foreground">Derivados</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-0.5 shadow-sm">
            <p className="text-xl font-bold text-foreground">{admittedCount}</p>
            <p className="text-sm text-muted-foreground">Admitidos</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-0.5 shadow-sm">
            <p className="text-xl font-bold text-foreground">100%</p>
            <p className="text-sm text-muted-foreground">Articulación</p>
          </div>
        </div>

        {/* Casos Prioritarios Entrantes - Sincronizados */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Casos Entrantes
            </h2>
            <span className="text-sm text-muted-foreground">
              {patients.length} pacientes en red
            </span>
          </div>

          <div className="space-y-3">
            {patients.map((item) => {
              const isAdmitted = item.status === "cita_programada" || item.status === "en_evaluacion"

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${isAdmitted
                    ? "bg-muted/20 border-border/50 opacity-75"
                    : "bg-card border-border/80 shadow-sm"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        onClick={() => navigate(`/app/clinico/casos/${item.id}`)}
                        className="text-base font-semibold text-foreground hover:underline cursor-pointer"
                      >
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.ageDisplay} · {item.origin}
                      </p>
                    </div>

                    {isAdmitted ? (
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 flex items-center gap-1 shrink-0">
                        <Check size={14} weight="bold" />
                        <span>Admitido</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.riskLevel === "alto"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}
                      >
                        {item.riskLabel}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tamizaje CRED reporta {item.lastScreeningScore || "alertas en reciprocidad social y lenguaje"}. Cuidador: {item.guardian}.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {!isAdmitted && (
                      <button
                        type="button"
                        onClick={() => handleAdmit(item.id)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 text-white hover:bg-zinc-900 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm"
                      >
                        <UserCheck size={16} weight="bold" />
                        <span>Admitir y Programar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/app/clinico/casos/${item.id}`)}
                      className="py-2.5 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm flex items-center gap-1.5 border border-border active:scale-[0.99] transition-all"
                    >
                      <FileText size={16} />
                      <span>Ficha 360°</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Nota minimalista de interoperabilidad */}
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-border space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-white" />
            <h3 className="text-md font-semibold text-white">
              Red Integrada de Salud (RIS) & INSN San Borja
            </h3>
          </div>
          <p className="text-sm text-white">
            La admisión notifica en tiempo real al centro de salud de origen para el seguimiento del carné CRED.
          </p>
        </div>
      </div>
    </div>
  )
}
