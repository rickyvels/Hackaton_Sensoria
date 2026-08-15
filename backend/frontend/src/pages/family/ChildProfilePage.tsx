import { useState } from "react"
import { Link } from "react-router-dom"
import { Baby, BookOpen, CalendarDays, CheckCircle2, Pencil, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCase, type ChildProfileUpdate } from "@/context/CaseContext"

interface ProfileForm extends Omit<ChildProfileUpdate, "ageMonths"> {
  ageMonths: string
}

function toForm(profile: ChildProfileUpdate): ProfileForm {
  return { ...profile, ageMonths: String(profile.ageMonths) }
}

export function ChildProfilePage() {
  const { activePatient, patients, updateChildProfile } = useCase()
  const child = activePatient ?? patients[0]
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [form, setForm] = useState<ProfileForm>(() =>
    toForm({ name: child.name, ageMonths: child.ageMonths, guardian: child.guardian, phone: child.phone }),
  )
  const [formError, setFormError] = useState<string | null>(null)

  const openEditor = () => {
    setForm(toForm({ name: child.name, ageMonths: child.ageMonths, guardian: child.guardian, phone: child.phone }))
    setFormError(null)
    setIsEditorOpen(true)
  }

  const handleSave = () => {
    const trimmedAge = form.ageMonths.trim()
    const ageMonths = Number(trimmedAge)
    if (!form.name.trim() || !trimmedAge || !Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > 216) {
      setFormError("Completa el nombre y una edad entre 0 y 216 meses.")
      return
    }

    updateChildProfile(child.id, {
      name: form.name.trim(),
      ageMonths,
      guardian: form.guardian.trim() || "Persona cuidadora",
      phone: form.phone.trim(),
    })
    setHasSaved(true)
    setIsEditorOpen(false)
  }

  return (
    <div className="space-y-5 pb-4">
      <header className="space-y-2 pt-2">
        <p className="text-base font-medium text-primary">Perfil familiar</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Mi hijo</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Guarda datos simples para ordenar los recursos y los hitos según su edad.
        </p>
      </header>

      {hasSaved && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-foreground">
          <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-base font-medium">Información actualizada</p>
        </div>
      )}

      <Card className="overflow-hidden rounded-3xl border-border/80 shadow-none">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Baby className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-foreground">{child.name}</p>
              <p className="text-base text-muted-foreground">{child.ageDisplay}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 border-y border-border/70 py-4 text-base sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Persona cuidadora</dt><dd className="font-medium text-foreground">{child.guardian}</dd></div>
            <div><dt className="text-muted-foreground">Teléfono</dt><dd className="font-medium text-foreground">{child.phone || "Aún no registrado"}</dd></div>
          </dl>

          <Button className="h-11 w-full text-base" onClick={openEditor}>
            <Pencil className="size-4" aria-hidden="true" /> Editar información
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3" aria-labelledby="next-actions-title">
        <div>
          <h2 id="next-actions-title" className="text-xl font-semibold text-foreground">¿Qué quieren hacer ahora?</h2>
          <p className="text-base text-muted-foreground">Elige una acción para acompañar su desarrollo.</p>
        </div>

        <Card className="rounded-3xl border-border/80 shadow-none"><CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="size-5" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1"><h3 className="text-lg font-semibold text-foreground">Recursos para su edad</h3><p className="text-base text-muted-foreground">Guías, videos y actividades para aprender en casa.</p></div>
          <Button asChild className="h-11 shrink-0 text-base"><Link to="/app/recursos">Ver</Link></Button>
        </CardContent></Card>

        <Card className="rounded-3xl border-border/80 shadow-none"><CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="size-5" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1"><h3 className="text-lg font-semibold text-foreground">Prepararnos para una consulta</h3><p className="text-base text-muted-foreground">Revisa la ruta y los datos de la próxima atención.</p></div>
          <Button asChild variant="outline" className="h-11 shrink-0 text-base"><Link to="/app/citas">Ver</Link></Button>
        </CardContent></Card>
      </section>

      <div className="flex gap-3 rounded-2xl bg-muted p-4 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p className="text-base leading-relaxed">Esta información organiza la experiencia familiar. No reemplaza una evaluación profesional ni genera un diagnóstico.</p>
      </div>

      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] space-y-5 overflow-y-auto pb-8 pt-6">
          <SheetHeader className="text-left"><SheetTitle>Información de mi hijo</SheetTitle><SheetDescription>Usa solo los datos necesarios para personalizar recursos y actividades.</SheetDescription></SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-base font-medium text-foreground" htmlFor="child-name">Nombre de tu hijo o hija</label><Input id="child-name" value={form.name} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))} /></div>
            <div className="space-y-2"><label className="text-base font-medium text-foreground" htmlFor="child-age">Edad en meses</label><Input id="child-age" inputMode="numeric" min="0" max="216" type="number" value={form.ageMonths} onChange={(event) => setForm((previous) => ({ ...previous, ageMonths: event.target.value }))} /></div>
            <div className="space-y-2"><label className="text-base font-medium text-foreground" htmlFor="child-guardian">Persona cuidadora</label><Input id="child-guardian" value={form.guardian} onChange={(event) => setForm((previous) => ({ ...previous, guardian: event.target.value }))} /></div>
            <div className="space-y-2"><label className="text-base font-medium text-foreground" htmlFor="child-phone">Teléfono de contacto</label><Input id="child-phone" inputMode="tel" type="tel" value={form.phone} onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))} /></div>
          </div>
          {formError && <p id="child-profile-error" role="alert" className="text-base text-destructive">{formError}</p>}
          <Button className="h-11 w-full text-base" onClick={handleSave}>Guardar cambios</Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}
