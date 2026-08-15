import { useState, type ReactNode } from "react"
import { ArrowUp, BookOpen, ExternalLink, LockKeyhole, Sparkles } from "lucide-react"

import { askAssistant, type AssistantHistoryMessage, type AssistantSource } from "@/services/assistantApi"
import { useOptionalCase } from "@/context/CaseContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RagResourceViewerSheet } from "@/components/resources/RagResourceViewerSheet"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export interface AiAssistantModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  id: number
  role: "assistant" | "user"
  content: string
  disclaimer?: string
  sources?: AssistantSource[]
}

const STARTER_PROMPTS = [
  "¿Qué recursos son adecuados para su edad?",
  "Me preocupa una señal que he observado",
  "¿Cómo me preparo para una consulta?",
]

const POSSIBLE_PERSONAL_IDENTIFIER = /\b\d(?:[\s-]?\d){7,8}\b/
const MAX_MESSAGE_LENGTH = 1_200

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part,
  )
}

function AssistantResponseText({ content }: { content: string }) {
  return (
    <div className="space-y-2">
      {content.split(/\n\s*\n/).map((block, blockIndex) => {
        const lines = block.split("\n")
        const isList = lines.every((line) => /^[-*]\s+/.test(line))
        if (isList) {
          return <ul key={blockIndex} className="list-disc space-y-1 pl-5">{lines.map((line, lineIndex) => <li key={lineIndex}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>)}</ul>
        }
        return <p key={blockIndex}>{lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{renderInlineMarkdown(line)}</span>)}</p>
      })}
    </div>
  )
}

export function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  const caseContext = useOptionalCase()
  const [hasConsent, setHasConsent] = useState(false)
  const [draft, setDraft] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedResource, setSelectedResource] = useState<AssistantSource | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hola. Puedo ayudarte a encontrar recursos revisados para acompañar el desarrollo de tu hijo.",
    },
  ])

  async function sendMessage(message = draft) {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isLoading) {
      return
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError("Tu consulta es muy larga. Resúmela en menos de 1200 caracteres.")
      return
    }

    if (POSSIBLE_PERSONAL_IDENTIFIER.test(trimmedMessage)) {
      setError("Por tu privacidad, elimina números que parezcan DNI o teléfonos antes de enviar la consulta.")
      return
    }

    setDraft("")
    setError("")
    setIsLoading(true)
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: trimmedMessage },
    ])

    try {
      const reply = await askAssistant({
        message: trimmedMessage,
        childAgeMonths: caseContext?.activePatient?.ageMonths,
        history: messages.slice(-6).map<AssistantHistoryMessage>(({ role, content }) => ({ role, content })),
      })
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: reply.answer,
          disclaimer: reply.disclaimer,
          sources: reply.sources,
        },
      ])
    } catch {
      setError("No pude conectar con el asistente local. Intenta nuevamente en unos minutos.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="flex h-[92vh] max-h-[95vh] flex-col gap-0 overflow-hidden rounded-t-3xl p-0">
        {!hasConsent ? (
          <section className="flex h-full flex-col px-5 pb-6 pt-12">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LockKeyhole aria-hidden="true" className="h-7 w-7" />
            </div>
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl">Antes de empezar</SheetTitle>
              <SheetDescription className="leading-6">
                Este asistente busca información en los recursos revisados de Neuroalianza. No diagnostica ni reemplaza una consulta profesional.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-medium text-foreground">Tu privacidad importa</p>
              <p className="mt-1">
                Al continuar, tu pregunta y la edad en meses, si la registraste, se envían a Qwen, que se ejecuta en este equipo. No envíes nombres, DNI ni teléfonos.
              </p>
            </div>

            <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
              <Button type="button" variant="outline" className="h-11" onClick={onClose}>
                Ahora no
              </Button>
              <Button type="button" className="h-11" onClick={() => setHasConsent(true)}>
                Continuar
              </Button>
            </div>
          </section>
        ) : (
          <section className="flex h-full min-h-0 flex-col">
            <header className="border-b border-border px-5 pb-4 pt-10">
              <div className="flex items-center gap-3 pr-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Asistente Neuroalianza</h2>
                  <p className="text-sm text-muted-foreground">Información basada en recursos revisados</p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
              <div className="space-y-4">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={message.role === "user" ? "ml-10 rounded-2xl rounded-br-md bg-primary px-4 py-3 text-base leading-7 text-primary-foreground" : "mr-6 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-base leading-7 text-foreground"}
                  >
                    {message.role === "assistant" ? <AssistantResponseText content={message.content} /> : <p>{message.content}</p>}
                    {message.disclaimer && (
                      <p className="mt-3 border-t border-border/80 pt-3 text-base leading-6 text-muted-foreground">
                        {message.disclaimer}
                      </p>
                    )}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 border-t border-border/80 pt-3">
                        <p className="mb-2 text-base font-semibold uppercase tracking-wide text-muted-foreground">Fuentes</p>
                        <ul className="space-y-2">
                          {message.sources.map((source) => (
                            <li key={source.id} className="text-base leading-6">
                              <button type="button" className="flex min-h-11 w-full items-start gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left text-primary transition-colors hover:bg-muted" onClick={() => setSelectedResource(source)}>
                                {source.resourceTypes.includes("video") ? <ExternalLink aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <BookOpen aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                                <span><strong>{source.title}</strong><br /><span className="text-muted-foreground">{source.institution} · {source.resourceTypes.includes("video") ? "Ver video" : "Leer ficha"}</span></span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}

                {isLoading && (
                  <div className="mr-12 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                    Buscando en los recursos revisados…
                  </div>
                )}
              </div>

              {messages.length === 1 && !isLoading && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <Button key={prompt} type="button" variant="outline" size="sm" className="h-auto whitespace-normal py-2 text-left" onClick={() => void sendMessage(prompt)}>
                      {prompt}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <form
              className="border-t border-border bg-background px-5 py-4"
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage()
              }}
            >
              <label htmlFor="assistant-message" className="sr-only">Escribe tu consulta</label>
              <div className="flex items-end gap-2">
                <Textarea
                  id="assistant-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ejemplo: ¿Qué actividad puedo hacer con mi hijo de 18 meses?"
                  className="min-h-11 max-h-28 resize-none py-2.5"
                  rows={1}
                  maxLength={MAX_MESSAGE_LENGTH}
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-xl" disabled={!draft.trim() || isLoading} aria-label="Enviar consulta">
                  <ArrowUp aria-hidden="true" className="h-5 w-5" />
                </Button>
              </div>
              {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
              <p className="mt-2 text-xs leading-5 text-muted-foreground">No compartas datos personales. El asistente no da diagnósticos ni atiende emergencias.</p>
            </form>
          </section>
        )}
        <RagResourceViewerSheet resource={selectedResource} onClose={() => setSelectedResource(null)} />
      </SheetContent>
    </Sheet>
  )
}
