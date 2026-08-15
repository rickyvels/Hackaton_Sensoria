export interface AssistantSource {
  id: string
  title: string
  institution: string
  url?: string
  resourceTypes: string[]
  excerpt: string
  relativePath: string
  sourceFilePath?: string
}

export interface AssistantResponse {
  answer: string
  disclaimer: string
  sources: AssistantSource[]
}

interface AssistantApiResponse {
  answer: string
  disclaimer: string
  sources: Array<{
    resource_id: string
    title: string
    institution: string
    official_url: string | null
    resource_types: string[]
    excerpt: string
    relative_path: string
    source_file_path: string | null
  }>
}

export interface AssistantHistoryMessage {
  role: "user" | "assistant"
  content: string
}

interface AskAssistantInput {
  message: string
  childAgeMonths?: number
  history: AssistantHistoryMessage[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

export async function askAssistant({ message, childAgeMonths, history }: AskAssistantInput): Promise<AssistantResponse> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30_000)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/family/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question: message,
        child_age_months: childAgeMonths,
        history,
        consent_granted: true,
      }),
    })
  } finally {
    window.clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new Error("No se pudo obtener una respuesta del asistente.")
  }

  const data = await response.json() as AssistantApiResponse
  return {
    answer: data.answer,
    disclaimer: data.disclaimer,
    sources: data.sources.map((source) => ({
      id: source.resource_id,
      title: source.title,
      institution: source.institution,
      url: source.official_url ?? undefined,
      resourceTypes: source.resource_types,
      excerpt: source.excerpt,
      relativePath: source.relative_path,
      sourceFilePath: source.source_file_path ?? undefined,
    })),
  }
}

export function getAssistantSourceFileUrl(sourceFilePath: string) {
  return `${API_BASE_URL}/api/v1/family/assistant/source-file?path=${encodeURIComponent(sourceFilePath)}`
}
