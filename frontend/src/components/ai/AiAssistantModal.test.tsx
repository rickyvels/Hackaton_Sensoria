import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { askAssistant } from "@/services/assistantApi"
import { CaseProvider } from "@/context/CaseContext"
import { AiAssistantModal } from "./AiAssistantModal"

vi.mock("@/services/assistantApi", () => ({
  askAssistant: vi.fn(),
  getAssistantSourceFileUrl: (sourceFilePath: string) => `/source-file?path=${sourceFilePath}`,
}))

const askAssistantMock = vi.mocked(askAssistant)

afterEach(() => {
  vi.clearAllMocks()
})

function renderModal() {
  return render(
    <CaseProvider>
      <AiAssistantModal isOpen onClose={vi.fn()} />
    </CaseProvider>,
  )
}

describe("AiAssistantModal", () => {
  it("solicita consentimiento antes de permitir una consulta", () => {
    renderModal()

    expect(screen.getByRole("heading", { name: "Antes de empezar" })).toBeInTheDocument()
    expect(screen.getByText(/no envíes nombres, dni ni teléfonos/i)).toBeInTheDocument()
    expect(screen.queryByLabelText("Escribe tu consulta")).not.toBeInTheDocument()
  })

  it("envía una consulta sin datos identificatorios y muestra sus fuentes", async () => {
    askAssistantMock.mockResolvedValueOnce({
      answer: "Puedes revisar **actividades simples** acordes a su edad.",
      disclaimer: "Esta orientación no reemplaza una evaluación profesional.",
      sources: [
        {
          id: "MINSA_CARTILLA_TEA_2022",
          title: "Cartilla de señales de alerta",
          institution: "MINSA",
          url: "https://www.gob.pe/minsa",
          resourceTypes: ["lectura"],
          excerpt: "Material de referencia para familias.",
          relativePath: "02_RAG_READY/02_senales/MINSA_CARTILLA_TEA_2022.md",
          sourceFilePath: "00_RAW/source_files/MINSA_CARTILLA_TEA_2022.pdf",
        },
      ],
    })

    renderModal()
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))
    fireEvent.change(screen.getByLabelText("Escribe tu consulta"), {
      target: { value: "¿Qué actividad puedo hacer con mi hijo?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }))

    await waitFor(() => {
      expect(askAssistantMock).toHaveBeenCalledWith({
        message: "¿Qué actividad puedo hacer con mi hijo?",
        childAgeMonths: 18,
        history: [
          {
            role: "assistant",
            content: "Hola. Puedo ayudarte a encontrar recursos revisados para acompañar el desarrollo de tu hijo.",
          },
        ],
      })
    })

    expect(await screen.findByText("actividades simples").then((element) => element.tagName)).toBe("STRONG")
    expect(screen.getByText("Esta orientación no reemplaza una evaluación profesional.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /cartilla de señales de alerta/i }))
    expect(await screen.findByRole("link", { name: /abrir fuente oficial/i })).toHaveAttribute(
      "href",
      "https://www.gob.pe/minsa",
    )
  })

  it("evita enviar números que parecen datos identificatorios", () => {
    renderModal()
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))
    fireEvent.change(screen.getByLabelText("Escribe tu consulta"), {
      target: { value: "El DNI de mi hijo es 78349201" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }))

    expect(screen.getByRole("alert")).toHaveTextContent(/elimina números que parezcan dni o teléfonos/i)
    expect(askAssistantMock).not.toHaveBeenCalled()
  })
})
