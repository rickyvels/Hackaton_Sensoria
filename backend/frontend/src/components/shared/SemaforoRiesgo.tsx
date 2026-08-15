import { CheckCircle, Warning, WarningOctagon } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type NivelRiesgo = "BAJO" | "MODERADO" | "ALTO"

interface SemaforoRiesgoProps {
  nivel: NivelRiesgo
  justificacion?: string
  recomendacion?: string
}

export function SemaforoRiesgo({
  nivel,
  justificacion = "Resultado obtenido según los instrumentos estandarizados aplicados.",
  recomendacion,
}: SemaforoRiesgoProps) {
  const configs = {
    BAJO: {
      titulo: "Desarrollo Acorde a la Edad (Bajo Riesgo)",
      badgeText: "Bajo Riesgo",
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      cardClass: "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20",
      icon: CheckCircle,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      defaultRec: "Continuar estimulación en el hogar y asistir al próximo control CRED programado.",
    },
    MODERADO: {
      titulo: "Señales en Observación (Riesgo Moderado)",
      badgeText: "Riesgo Moderado",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      cardClass: "border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20",
      icon: Warning,
      iconClass: "text-amber-600 dark:text-amber-400",
      defaultRec: "Reforzar actividades en casa y programar reevaluación de seguimiento en 30-60 días.",
    },
    ALTO: {
      titulo: "Alerta de Neurodesarrollo (Alto Riesgo)",
      badgeText: "Alto Riesgo / Alerta",
      badgeClass: "bg-destructive/15 text-destructive dark:text-red-400 border-destructive/30",
      cardClass: "border-destructive/30 bg-destructive/5 dark:bg-destructive/10",
      icon: WarningOctagon,
      iconClass: "text-destructive",
      defaultRec: "Generar solicitud de referencia prioritaria a evaluación multidisciplinaria especializada.",
    },
  }

  const config = configs[nivel]
  const Icon = config.icon

  return (
    <Card className={`overflow-hidden border transition-all ${config.cardClass}`}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon size={24} weight="fill" className={`shrink-0 ${config.iconClass}`} />
            <h3 className="text-md font-bold text-foreground leading-snug">{config.titulo}</h3>
          </div>
          <Badge variant="outline" className={`shrink-0 font-medium text-md ${config.badgeClass}`}>
            {config.badgeText}
          </Badge>
        </div>

        <p className="text-md text-muted-foreground leading-relaxed">
          {justificacion}
        </p>

        <div className="rounded-xl bg-background/80 p-3 border border-border">
          <p className="text-md font-semibold text-foreground mb-1">Recomendación de acción:</p>
          <p className="text-md text-foreground/90 leading-relaxed">
            {recomendacion || config.defaultRec}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
