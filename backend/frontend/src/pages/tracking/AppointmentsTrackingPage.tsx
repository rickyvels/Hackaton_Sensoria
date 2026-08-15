import { useState } from "react"
import { Link } from "react-router-dom"
import {
  MapPin,
  Clock,
  User,
  CheckCircle,
  CaretRight,
  Plus,
  Hospital,
  PhoneCall,
  Info,
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

interface AppointmentDetail {
  id: string
  title: string
  hospital: string
  doctor: string
  specialty: string
  date: string
  time: string
  room: string
  status: "en_proceso" | "completado" | "pendiente"
  statusLabel: string
  stepIndex: number
  instructions: string[]
}

const UPCOMING_APPOINTMENT: AppointmentDetail = {
  id: "apt-1",
  title: "Evaluación Especializada 360°",
  hospital: "INSN San Borja",
  doctor: "Dra. Marcela Valdivia",
  specialty: "Neuropediatría",
  date: "Jueves 18 de Agosto, 2026",
  time: "09:30 AM",
  room: "Consultorio 304 (Piso 3)",
  status: "en_proceso",
  statusLabel: "En proceso",
  stepIndex: 2,
  instructions: [
    "Llevar DNI físico del menor y del apoderado.",
    "Presentar carné de control CRED y cartilla de vacunación.",
    "Llegar 15 minutos antes de la hora programada.",
  ],
}

const PAST_APPOINTMENTS = [
  {
    id: "past-1",
    title: "Tele-interconsulta y Derivación RIS",
    location: "Red Integrada de Salud",
    date: "05 Ago, 2026",
    status: "Completado",
  },
  {
    id: "past-2",
    title: "Tamizaje de Neurodesarrollo CRED",
    location: "Posta de Salud San Juan",
    date: "02 Ago, 2026",
    status: "Completado",
  },
]

export function AppointmentsTrackingPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetail | null>(null)

  return (
    <div className="-mx-4 -mt-4 flex flex-col">
      {/* 1. Hero Superior con Imagen y Capa Gradiente */}
      <section
        className="text-white px-4 pt-7 pb-12 relative overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/de1xmnmeq/image/upload/v1786777435/pastel-mountains-vector-art-05xdup4f0zu2tvqa_km0pbp.jpg')`,
        }}
      >
        {/* Capa Gradiente de arriba hacia abajo (Transparente a Negro 60%) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

        {/* Barra Superior Espaciadora */}
        <div className="flex items-center justify-between relative z-10 h-20">
        </div>

        {/* Sección Central Destacada */}
        <div className="text-center py-16 space-y-2 relative z-10">
          <p className="text-lg font-normal text-white/90">
            Ruta de Atención
          </p>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            Mateo Quintanilla
          </h1>
          <p className="text-sm font-normal text-white/80">
            Paso 2 de 4 · Revisión por Neuropediatría
          </p>
        </div>

        {/* 4 Segmentos de Progreso Translúcidos en el Hero */}
        <div className="grid grid-cols-4 gap-2 pt-2 max-w-xs mx-auto relative z-10">
          <div className="h-1.5 rounded-full bg-white" />
          <div className="h-1.5 rounded-full bg-white" />
          <div className="h-1.5 rounded-full bg-white/30" />
          <div className="h-1.5 rounded-full bg-white/30" />
        </div>
      </section>

      {/* 2. Contenido Inferior Solapado con Esquinas Redondeadas */}
      <div className="bg-background rounded-t-3xl -mt-4 px-4 pt-5 pb-8 space-y-5 relative z-20 shadow-lg">
        {/* Sección: Próxima Atención Destacada */}
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-foreground">
            Próxima Atención
          </h2>

          <div
            onClick={() => setSelectedAppointment(UPCOMING_APPOINTMENT)}
            className="cursor-pointer group block"
          >
            <Card className="bg-card border border-border/80 shadow-none hover:border-primary/40 transition-all rounded-3xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-primary">
                      {UPCOMING_APPOINTMENT.hospital} · {UPCOMING_APPOINTMENT.specialty}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">
                      {UPCOMING_APPOINTMENT.date}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>{UPCOMING_APPOINTMENT.statusLabel}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary shrink-0" />
                    <span className="text-foreground">{UPCOMING_APPOINTMENT.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary shrink-0" />
                    <span>{UPCOMING_APPOINTMENT.doctor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary shrink-0" />
                    <span>{UPCOMING_APPOINTMENT.room}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-sm">
                  <span className="text-muted-foreground">Ver preparación y requisitos</span>
                  <CaretRight
                    size={16}
                    className="text-primary group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sección: Atenciones Anteriores */}
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-foreground">
            Atenciones Anteriores
          </h2>

          <div className="space-y-2">
            {PAST_APPOINTMENTS.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-card border border-border/70 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <p className="text-sm font-normal text-muted-foreground">
                    {item.location}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground">{item.date}</span>
                  <CheckCircle size={18} weight="fill" className="text-primary" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sección: Acción Rápida de Agendamiento */}
        <section className="pt-1">
          <Link to="/app/salud" className="block group">
            <button
              type="button"
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-sm"
            >
              <Plus size={18} weight="bold" />
              <span>Agendar Nueva Cita o Control CRED</span>
            </button>
          </Link>
        </section>
      </div>

      {/* 3. Bottom Sheet de Detalle de Cita */}
      <Sheet
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      >
        <SheetContent
          side="bottom"
          className="pb-8 pt-4 space-y-5 max-h-[85vh] overflow-y-auto"
        >
          {/* Barra de agarre superior */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

          {selectedAppointment && (
            <div className="space-y-4">
              <SheetHeader className="text-left space-y-1">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <Hospital size={16} />
                  <span>{selectedAppointment.hospital} · {selectedAppointment.specialty}</span>
                </div>
                <SheetTitle className="text-lg font-semibold text-foreground">
                  {selectedAppointment.title}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground leading-relaxed pt-0.5">
                  {selectedAppointment.doctor} · {selectedAppointment.room}
                </SheetDescription>
              </SheetHeader>

              {/* Ficha de Fecha y Hora */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/70 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fecha</span>
                  <span className="font-semibold text-foreground">{selectedAppointment.date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hora de atención</span>
                  <span className="font-semibold text-foreground">{selectedAppointment.time}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="text-primary font-medium">{selectedAppointment.statusLabel}</span>
                </div>
              </div>

              {/* Requisitos y Preparación */}
              <div className="space-y-2 pt-1">
                <p className="text-sm font-semibold text-foreground">
                  Requisitos y Preparación
                </p>
                <div className="space-y-2">
                  {selectedAppointment.instructions.map((inst, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-card border border-border/70 flex items-start gap-2.5"
                    >
                      <Info size={18} className="text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground leading-relaxed">
                        {inst}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de Contacto o Asistencia */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="w-full h-12 rounded-2xl bg-card border border-border/80 text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted active:scale-[0.99] transition-all"
                >
                  <PhoneCall size={18} />
                  <span>Coordinar con Enlace de Telesalud</span>
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
