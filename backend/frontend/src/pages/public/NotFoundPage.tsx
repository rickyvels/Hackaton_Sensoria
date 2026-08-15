import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <span className="text-2xl font-black font-heading">404</span>
      </div>
      <h1 className="text-2xl font-bold font-heading text-foreground mb-2">
        Página no encontrada
      </h1>
      <p className="text-md text-muted-foreground max-w-sm mb-6">
        La ruta a la que intentas acceder no existe o fue movida dentro de la plataforma Neuroalianza.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/">
          <Button variant="outline" className="min-h-11 gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Landing</span>
          </Button>
        </Link>
        <Link to="/app">
          <Button className="min-h-11 gap-2 font-semibold">
            <Home className="w-4 h-4" />
            <span>Ir a la Aplicación</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
