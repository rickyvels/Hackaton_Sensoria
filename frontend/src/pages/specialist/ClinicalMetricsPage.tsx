import { useNavigate, Link } from "react-router-dom"
import {
  CaretLeft,
  TrendUp,
} from "@phosphor-icons/react"

export function ClinicalMetricsPage() {
  const navigate = useNavigate()

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
            INSN San Borja · Red Nacional
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Métricas de Oportunidad
          </h1>
          <p className="text-sm font-normal text-white/80">
            Tiempos de Espera y Eficiencia en Derivación
          </p>
        </div>
      </section>

      {/* 2. Contenedor Solapado */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-6 pb-12 space-y-6 relative z-20 flex-1">
        {/* Banner de Impacto */}
        <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-1">
          <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
            <TrendUp size={16} weight="bold" />
            <span>Reducción de Tiempo de Espera</span>
          </div>
          <p className="text-xl font-bold text-white tracking-tight">
            De 8.5 meses a 14 días
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Mediana de tiempo transcurrido desde el tamizaje en puesto CRED hasta la primera cita con Neuropediatría.
          </p>
        </div>

        {/* Cuadrícula de KPIs Principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Casos Tamizados
            </p>
            <p className="text-2xl font-bold text-foreground">1,248</p>
            <p className="text-xs text-muted-foreground font-medium">Este mes (+18%)</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tasa de Detección
            </p>
            <p className="text-2xl font-bold text-foreground">14.2%</p>
            <p className="text-xs text-muted-foreground">Alto / Mod. riesgo</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admitidos a Tiempo
            </p>
            <p className="text-2xl font-bold text-foreground">92%</p>
            <p className="text-xs text-muted-foreground font-medium">Meta &gt; 90%</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Inasistencia
            </p>
            <p className="text-2xl font-bold text-foreground">8.4%</p>
            <p className="text-sm text-zinc-500">Con motivo registrado</p>
          </div>
        </div>

        {/* Desglose de Motivos de Inasistencia */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <h3 className="text-md font-semibold text-muted-foreground uppercase tracking-wider">
            Causas Declaradas de Inasistencia
          </h3>

          <div className="space-y-2">
            {[
              { label: "Dificultad de transporte / Pasaje", pct: 45, count: 24 },
              { label: "Horario laboral de cuidadores", pct: 28, count: 15 },
              { label: "Distancia desde provincias", pct: 18, count: 10 },
              { label: "Salud del menor", pct: 9, count: 5 },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-md font-medium">
                  <span className="text-foreground">{item.label}</span>
                  <span className="text-zinc-500">{item.pct}% ({item.count})</span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-950 dark:bg-zinc-100 h-full rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Link
            to="/app/clinico"
            className="w-full h-12 rounded-2xl border border-border bg-card text-foreground font-medium text-sm flex items-center justify-center hover:bg-muted active:scale-[0.98] transition-all"
          >
            Volver a la Bandeja
          </Link>
        </div>
      </div>
    </div>
  )
}
