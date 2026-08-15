import { Link } from "react-router-dom"
import {
  Activity,
  ArrowRight,
  Baby,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BRAND_NAME_PARTS } from "@/config/brand"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* 1. Header de Navegación Responsive */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-lg sm:text-xl font-bold font-heading t-tight text-foreground">
                {BRAND_NAME_PARTS.lead}
                <span className="text-primary">{BRAND_NAME_PARTS.accent}</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-md font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                INSN San Borja 2026
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Portal del personal médico y administrativo. Vive fuera de esta aplicación, así
                que sale en una pestaña nueva y no pasa por el enrutador. */}
            <a
              href="https://github.com/miguel-isidro05/neuroalianza-ruta-viva-mvp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Personal médico y administrativo (se abre en una pestaña nueva)"
            >
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 w-11 justify-center gap-1.5 px-0 font-medium lg:w-auto lg:px-3"
              >
                <Stethoscope className="w-4 h-4 shrink-0 text-primary" />
                {/* Medido en el header real: el rótulo completo solo cabe junto a los otros dos
                    botones desde 1280px, y el corto desde 1024px. Por debajo de eso el badge
                    "INSN San Borja 2026" se parte en dos líneas y rebasa el alto del header, así
                    que ahí queda solo el icono (el nombre lo da el aria-label del enlace). */}
                <span className="hidden lg:inline xl:hidden">Personal Médico</span>
                <span className="hidden xl:inline">Personal Médico y Administrativo</span>
              </Button>
            </a>
            <Link to="/app/demo">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Demo Pitch</span>
              </Button>
            </Link>
            <Link to="/app">
              {/* Debajo de 360px el rótulo completo no cabe junto a la marca, así
                  que se acorta en vez de desbordar la página. */}
              <Button className="gap-2 font-semibold shadow-md shadow-primary/25 min-h-10 px-4 sm:px-5">
                <span className="hidden xs:inline">Abrir Aplicación</span>
                <span className="xs:hidden">Abrir</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge variant="outline" className="gap-2 py-1 px-3.5 border-primary/30 bg-primary/10 text-primary rounded-full text-md font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Desafío 04: Neurodesarrollo Infantil · Ventana 0 a 5 años</span>
              </Badge>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold t-tight text-foreground leading-[1.15]">
                Detección oportuna y red articulada para el{" "}
                <span className="bg-gradient-to-r from-primary via-primary/90 to-sky-600 bg-clip-text text-transparent">
                  neurodesarrollo pediátrico
                </span>
              </h1>

              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
                Plataforma PWA que conecta los controles CRED de postas de salud del primer nivel con el equipo multidisciplinario del{" "}
                <strong className="text-foreground font-semibold">Instituto Nacional de Salud del Niño San Borja</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                <Link to="/app" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto min-h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/25">
                    <span>Iniciar PWA Mobile</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/app/demo" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-12 px-6 text-base font-medium gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Panel Interactivo Demo</span>
                  </Button>
                </Link>
              </div>

              {/* Indicadores de Impacto */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 text-left">
                <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary font-heading">0-5 años</p>
                  <p className="text-md sm:text-md text-muted-foreground mt-0.5">Ventana crítica de máxima plasticidad cerebral</p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary font-heading">&lt; 3 min</p>
                  <p className="text-md sm:text-md text-muted-foreground mt-0.5">Tamizaje estandarizado rápido en postas CRED</p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary font-heading">360°</p>
                  <p className="text-md sm:text-md text-muted-foreground mt-0.5">Ficha multidisciplinaria para especialistas INSN-SB</p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary font-heading">100% PWA</p>
                  <p className="text-md sm:text-md text-muted-foreground mt-0.5">Mobile-First accesible con soporte offline</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Selector de Experiencias y Perfiles */}
        <section className="py-16 sm:py-20 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              Tres experiencias adaptadas para cada actor clave
            </h2>
            <p className="text-muted-foreground text-md sm:text-base">
              Selecciona un perfil para experimentar la interfaz móvil optimizada:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Perfil 1: Personal de Salud CRED */}
            <Card className="hover:border-primary/50 transition-all hover:shadow-lg flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">1.º Nivel de Atención</Badge>
                  <CardTitle className="text-xl font-bold font-heading">Personal de Salud CRED</CardTitle>
                </div>
                <CardDescription className="text-md">
                  Tamizaje rápido estandarizado, semáforo de riesgo clínico y derivación digital inmediata sin papeleos.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/app/salud">
                  <Button className="w-full min-h-11 gap-2 font-medium" variant="outline">
                    <span>Acceder a CRED</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Perfil 2: Familias */}
            <Card className="hover:border-primary/50 transition-all hover:shadow-lg border-primary/30 relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground shadow-sm">
                  Centro del Cuidado
                </Badge>
              </div>
              <CardHeader className="space-y-3 pt-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">Familias & Cuidadores</Badge>
                  <CardTitle className="text-xl font-bold font-heading">Portal Familiar</CardTitle>
                </div>
                <CardDescription className="text-md">
                  Ruta asistencial clara, confirmación y recordatorio de citas, y actividades de estimulación guiadas para el hogar.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/app/familia">
                  <Button className="w-full min-h-11 gap-2 font-semibold">
                    <span>Ver Portal Familiar</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Perfil 3: Especialistas INSN-SB */}
            <Card className="hover:border-primary/50 transition-all hover:shadow-lg flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">INSN San Borja</Badge>
                  <CardTitle className="text-xl font-bold font-heading">Especialistas 360°</CardTitle>
                </div>
                <CardDescription className="text-md">
                  Ficha Multidisciplinaria integrada (Neurología, Psiquiatría, Genética, Terapia), agenda agrupada y analítica de tiempos.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/app/clinico">
                  <Button className="w-full min-h-11 gap-2 font-medium" variant="outline">
                    <span>Ingresar como Clínico</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. Pilares del Desafío */}
        <section className="py-16 bg-muted/40 border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-center mb-10 text-foreground">
              Pilares de la Solución Tinkuy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Estratificación Temprana en CRED</h3>
                  <p className="text-md sm:text-md text-muted-foreground leading-relaxed">
                    Tamizaje rápido con preguntas observacionales clave para detectar riesgo de TEA, retraso psicomotor y trastornos del lenguaje.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/80">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Articulación Digital Directa</h3>
                  <p className="text-md sm:text-md text-muted-foreground leading-relaxed">
                    Comunicación fluida entre postas periféricas y el INSN-SB con tiempos de espera reducidos y seguimiento trazable.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/80">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Acompañamiento Continuo en el Hogar</h3>
                  <p className="text-md sm:text-md text-muted-foreground leading-relaxed">
                    Las familias reciben orientaciones personalizadas y micro-videos guiados mientras esperan su cita especializada.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/80">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Agenda Multidisciplinaria Inteligente</h3>
                  <p className="text-md sm:text-md text-muted-foreground leading-relaxed">
                    Agrupación de citas en un solo día para familias de provincias o zonas alejadas, reduciendo el ausentismo clínico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-border bg-card py-8 text-center text-md text-muted-foreground">
        <div className="container mx-auto px-4 space-y-2">
          <p className="font-medium text-foreground">
            Tinkuy © 2026 — Desarrollado para la Hackatón INSN San Borja (Desafío 04: Neurodesarrollo)
          </p>
          <p>
            Arquitectura PWA Mobile-First con React 19, TypeScript, Vite, shadcn/ui y Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  )
}
