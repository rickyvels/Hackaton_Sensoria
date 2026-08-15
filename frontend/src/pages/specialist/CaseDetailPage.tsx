import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { CaretLeft } from "@phosphor-icons/react"
import { useCase } from "@/context/CaseContext"

export function CaseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { patients } = useCase()

  const patient = patients.find((p) => p.id === id) || patients[0]

  const [activeTab, setActiveTab] = useState<"notas" | "tamizajes" | "plan" | "resumen">("notas")

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
            onClick={() => navigate("/app/clinico")}
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white hover:bg-white/25 active:scale-95 transition-all"
            aria-label="Volver"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
        </div>

        {/* Sección Central Destacada (Tipografía Canónica) */}
        <div className="text-center py-14 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            {patient.origin} · {patient.ageDisplay}
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            {patient.name}
          </h1>
          <p className="text-sm font-normal text-white/80">
            DNI {patient.dni} · Estado: {patient.statusLabel}
          </p>
        </div>
      </section>

      {/* 2. Contenedor Solapado */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-12 space-y-6 relative z-20 flex-1">
        {/* Selector de Pestañas Minimalista */}
        <div className="flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-border">
          {(
            [
              { id: "notas", label: "Notas Clínicas" },
              { id: "tamizajes", label: "Tamizajes" },
              { id: "plan", label: "Plan Terapéutico" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-md font-medium transition-all ${activeTab === tab.id
                ? "bg-zinc-950 text-white shadow-sm font-semibold"
                : "text-white/70 hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO PESTAÑA: NOTAS POR ESPECIALIDAD */}
        {activeTab === "notas" && (
          <div className="space-y-4">
            {/* Nota de Neuropediatría */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-950 text-white">
                  Neuropediatría
                </span>
                <span className="text-md text-muted-foreground">Hoy · 09:30 AM</span>
              </div>
              <p className="text-md font-semibold text-foreground">
                Dra. Marcela Valdivia — INSN San Borja
              </p>
              <p className="text-md text-muted-foreground leading-relaxed">
                Paciente ingresa con reporte de pérdida de palabras a los 16 meses y contacto visual inconsistente. Se programa evaluación neuropsicológica condensada para coordinar con familia proveniente de provincia.
              </p>
            </div>

            {/* Nota de Psicología Infantil */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-white">
                  Psicología Infantil
                </span>
                <span className="text-md text-muted-foreground">Hace 2 días</span>
              </div>
              <p className="text-md font-semibold text-foreground">
                Lic. Andrea Salas — INSN San Borja
              </p>
              <p className="text-md text-muted-foreground leading-relaxed">
                Observación de conducta: escaso seguimiento de instrucciones simples, juego no funcional con autos (giro de ruedas). Se sugiere sesión de orientación a cuidadores.
              </p>
            </div>

            {/* Nota de Terapia de Lenguaje */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-white">
                  Terapia de Lenguaje
                </span>
                <span className="text-md text-muted-foreground">05 Ago, 2026</span>
              </div>
              <p className="text-md font-semibold text-foreground">
                Lic. Rodrigo Silva — Red RIS
              </p>
              <p className="text-md text-muted-foreground leading-relaxed">
                Evaluación inicial de comunicación: balbuceo escaso, no señala para pedir objetos (usa la mano del adulto como herramienta).
              </p>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: HISTORIAL DE TAMIZAJES */}
        {activeTab === "tamizajes" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-950/10 border border-rose-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-md font-bold text-rose-800 dark:text-rose-600">
                  M-CHAT-R/F (18 meses)
                </span>
                <span className="text-md text-muted-foreground">05 Ago, 2026</span>
              </div>
              <p className="text-md text-foreground font-medium">
                Puntaje: 4 fallas críticas · Resultado: Alto Riesgo
              </p>
              <p className="text-md text-muted-foreground leading-relaxed">
                Aplicado en: {patient.origin} por Lic. Rosa Vega.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-md font-bold text-foreground">
                  Control CRED Hitos Motores (12 meses)
                </span>
                <span className="text-md text-muted-foreground">12 Feb, 2026</span>
              </div>
              <p className="text-md text-muted-foreground">
                Marcha con apoyo lograda, motricidad fina adecuada.
              </p>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: PLAN TERAPÉUTICO */}
        {activeTab === "plan" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-2">
              <p className="text-md text-zinc-400 font-medium">Objetivos Clínicos Prioritarios</p>
              <ul className="text-md text-zinc-300 space-y-1.5 list-disc list-inside">
                <li>Fortalecer contacto visual y respuesta al llamado por su nombre.</li>
                <li>Estimular intención comunicativa mediante señalización con dedo índice.</li>
                <li>Pautas de juego interactivo cara a cara con la madre en el hogar.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1.5">
              <p className="text-md font-semibold text-foreground">Frecuencia Programada</p>
              <p className="text-md text-muted-foreground">
                2 sesiones semanales de estimulación temprana + 1 control mensual en INSN SB.
              </p>
            </div>
          </div>
        )}

        {/* Botón de Acción Principal */}
        <div className="pt-2">
          <Link
            to="/app/clinico"
            className="w-full h-12 rounded-2xl border border-border bg-card text-foreground font-medium text-sm flex items-center justify-center hover:bg-muted active:scale-[0.98] transition-all"
          >
            Volver a la Bandeja de Casos
          </Link>
        </div>
      </div>
    </div>
  )
}
