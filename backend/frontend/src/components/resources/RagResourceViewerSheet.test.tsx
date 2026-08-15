import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { RagResourceViewerSheet } from "./RagResourceViewerSheet"

const videoResource = {
  id: "VIDEO_001",
  title: "Video de desarrollo",
  institution: "Institución validada",
  url: "https://www.youtube.com/watch?v=q0i4kjB8KhU",
  resourceTypes: ["video"],
  excerpt: "Recomendaciones para acompañar el desarrollo.",
  relativePath: "02_RAG_READY/03_casa/VIDEO_001.md",
}

const documentResource = {
  id: "MINSA_CARTILLA_TEA_2022",
  title: "Cartilla de señales de alerta",
  institution: "MINSA",
  resourceTypes: ["lectura"],
  excerpt: "Material de referencia para familias.",
  relativePath: "02_RAG_READY/02_senales/MINSA_CARTILLA_TEA_2022.md",
  sourceFilePath: "00_RAW/source_files/MINSA_CARTILLA_TEA_2022.pdf",
}

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true })
})

describe("RagResourceViewerSheet", () => {
  it("muestra un video de YouTube en un iframe sin cookies", () => {
    render(<RagResourceViewerSheet resource={videoResource} onClose={vi.fn()} />)

    expect(screen.getByTitle("Video: Video de desarrollo")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/q0i4kjB8KhU",
    )
    expect(screen.getByRole("link", { name: /abrir en youtube/i })).toHaveAttribute(
      "href",
      videoResource.url,
    )
  })

  it("prioriza la ficha descargable si no hay conexión", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false })
    render(<RagResourceViewerSheet resource={videoResource} onClose={vi.fn()} />)

    expect(screen.queryByTitle("Video: Video de desarrollo")).not.toBeInTheDocument()
    expect(screen.getByText(/video no disponible sin conexión/i)).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /abrir en youtube/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /guardar resumen/i })).toBeInTheDocument()
  })

  it("descarga el archivo original del RAG cuando existe", () => {
    render(<RagResourceViewerSheet resource={documentResource} onClose={vi.fn()} />)

    const downloadLink = screen.getByRole("link", { name: /guardar ficha original/i })
    expect(downloadLink).toHaveAttribute(
      "href",
      "/api/v1/family/assistant/source-file?path=00_RAW%2Fsource_files%2FMINSA_CARTILLA_TEA_2022.pdf",
    )
    expect(downloadLink).toHaveAttribute("download", "MINSA_CARTILLA_TEA_2022.pdf")
    expect(screen.getByText(/archivo rag original/i)).toHaveTextContent("MINSA_CARTILLA_TEA_2022.pdf")
  })
})
