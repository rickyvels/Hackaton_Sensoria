import { useEffect, useState } from "react"
import { Download, ExternalLink, FileText, Play, WifiOff } from "lucide-react"

import { getAssistantSourceFileUrl, type AssistantSource } from "@/services/assistantApi"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface RagResourceViewerSheetProps {
  resource: AssistantSource | null
  onClose: () => void
}

function getYouTubeEmbedUrl(url?: string) {
  if (!url) return undefined
  try {
    const parsedUrl = new URL(url)
    const videoId = parsedUrl.hostname.includes("youtu.be")
      ? parsedUrl.pathname.slice(1)
      : parsedUrl.searchParams.get("v")
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : undefined
  } catch {
    return undefined
  }
}

function downloadResourceSheet(resource: AssistantSource) {
  const text = [
    resource.title,
    `Institución: ${resource.institution}`,
    resource.url ? `Enlace oficial: ${resource.url}` : `Referencia local: ${resource.relativePath}`,
    "",
    resource.excerpt,
  ].join("\n")
  const downloadUrl = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = downloadUrl
  link.download = `${resource.id.toLowerCase()}-ficha.txt`
  link.click()
  URL.revokeObjectURL(downloadUrl)
}

function getFallbackDownloadName(resource: AssistantSource) {
  return `${resource.id.toLowerCase()}-resumen.txt`
}

export function RagResourceViewerSheet({ resource, onClose }: RagResourceViewerSheetProps) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const embedUrl = getYouTubeEmbedUrl(resource?.url)
  const isVideo = resource?.resourceTypes.includes("video") && Boolean(embedUrl)
  const sourceFileUrl = resource?.sourceFilePath ? getAssistantSourceFileUrl(resource.sourceFilePath) : undefined
  const sourceFileName = resource?.sourceFilePath?.split("/").at(-1)

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)
    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  return (
    <Sheet open={Boolean(resource)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[92vh] space-y-5 overflow-y-auto pb-7 pt-8">
        {resource && (
          <>
            <SheetHeader className="pr-8 text-left">
              <p className="text-base font-medium text-primary">{isVideo ? "Video recomendado" : "Material recomendado"}</p>
              <SheetTitle className="text-xl leading-7">{resource.title}</SheetTitle>
              <SheetDescription>{resource.institution}</SheetDescription>
            </SheetHeader>

            {isVideo && isOnline && embedUrl ? (
              <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
                <iframe
                  className="h-full w-full"
                  src={embedUrl}
                  title={`Video: ${resource.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  {isVideo ? <WifiOff className="mt-0.5 h-5 w-5 text-muted-foreground" /> : <FileText className="mt-0.5 h-5 w-5 text-primary" />}
                  <div>
                    <p className="font-medium text-foreground">{isVideo ? "Video no disponible sin conexión" : "Ficha del recurso"}</p>
                    <p className="mt-1 text-base leading-6 text-muted-foreground">{resource.excerpt}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {resource.url && (!isVideo || isOnline) && (
                <Button asChild className="h-11 w-full">
                  <a href={resource.url} target="_blank" rel="noreferrer">
                    {isVideo ? <Play aria-hidden="true" /> : <ExternalLink aria-hidden="true" />}
                    {isVideo ? "Abrir en YouTube" : "Abrir fuente oficial"}
                  </a>
                </Button>
              )}
              {sourceFileUrl ? (
                <Button asChild type="button" variant={resource.url ? "outline" : "default"} className="h-11 w-full">
                  <a href={sourceFileUrl} download={sourceFileName}>
                    <Download aria-hidden="true" />
                    Guardar ficha original
                  </a>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={resource.url ? "outline" : "default"}
                  className="h-11 w-full"
                  onClick={() => downloadResourceSheet(resource)}
                >
                  <Download aria-hidden="true" />
                  Guardar resumen del recurso
                </Button>
              )}
            </div>

            <p className="text-base leading-6 text-muted-foreground">
              {sourceFileName
                ? `Archivo RAG original: ${sourceFileName}`
                : resource.url
                  ? "Fuente oficial enlazada."
                  : `Referencia local: ${resource.relativePath}. Se guardará ${getFallbackDownloadName(resource)}.`}
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
