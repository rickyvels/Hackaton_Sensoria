const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export type Session = { access_token: string; user: { id: number; role: 'family' | 'professional'; dni: string; full_name: string } };

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({ detail: 'No se pudo conectar con la plataforma.' }))).detail || 'Error de plataforma');
  return response.json() as Promise<T>;
}

export const platformApi = {
  login: (dni: string, password: string) => request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ dni, password }) }),
  cases: (token: string) => request<{ items: CaseRow[] }>('/professional/cases', {}, token),
  caseDetail: (token: string, id: number) => request<CaseDetail>(`/professional/cases/${id}`, {}, token),
  feed: (token: string, id: number) => request<Feed>(`/cases/${id}/feed`, {}, token),
  decide: (token: string, id: number, body: { decision: 'approved' | 'rejected'; professional_note: string; authorized_proposal?: string }) => request<DecisionResult>(`/professional/cases/${id}/approval-decisions`, { method: 'POST', body: JSON.stringify(body) }, token),
  validateSynthesis: (token: string, id: number, body: { decision: 'approved' | 'rejected' | 'clarification_requested'; edited_summary?: string; professional_comment: string }) => request<CaseDetail>(`/professional/cases/${id}/synthesis-validation`, { method: 'POST', body: JSON.stringify(body) }, token),
  startRun: (token: string, caseId: number) => request<OrchestrationRun>(`/orchestration/cases/${caseId}/runs`, { method: 'POST' }, token),
  currentRun: (token: string, caseId: number) => request<OrchestrationRun | null>(`/orchestration/cases/${caseId}/runs/current`, {}, token),
  run: (token: string, runId: string) => request<OrchestrationRun>(`/orchestration/runs/${runId}`, {}, token),
  controlRun: (token: string, runId: string, action: 'pause' | 'resume') => request<OrchestrationRun>(`/orchestration/runs/${runId}/control`, { method: 'POST', body: JSON.stringify({ action }) }, token),
  graph: (token: string, caseId: number) => request<ProvenanceGraph>(`/orchestration/cases/${caseId}/graph`, {}, token),
  reviewNote: (token: string, caseId: number, noteId: number, professional_comment: string) => request<FamilyNote>(`/professional/cases/${caseId}/notes/${noteId}/review`, { method: 'POST', body: JSON.stringify({ professional_comment }) }, token),
  streamRun: async (token: string, runId: string, afterId: number, signal: AbortSignal, onEvent: (event: FeedEvent) => void) => {
    const response = await fetch(`${API_URL}/orchestration/runs/${runId}/events?after_id=${afterId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    if (!response.ok || !response.body) throw new Error('No se pudo observar la ejecución en vivo.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      for (const frame of frames) {
        const data = frame.split('\n').find((line) => line.startsWith('data: '))?.slice(6);
        if (data && data !== '{}') onEvent(JSON.parse(data) as FeedEvent);
      }
    }
  },
};

export type CareStage = 'detection' | 'referral' | 'assessment' | 'intervention' | 'followup' | 'discharge';
export type NoteSetting = 'casa' | 'colegio' | 'terapia' | 'comunidad' | 'otro';
export type NoteProgress = 'avance' | 'sin_cambios' | 'retroceso';
export type FamilyNote = { id: number; setting: NoteSetting; observation: string; progress: NoteProgress; occurred_on: string; author_name: string; professional_comment?: string | null; reviewed_at?: string | null; created_at: string };
export type FamilyNoteSummary = { total: number; advances: number; steady: number; setbacks: number; pending_review: number };
export type CaseRow = { id: number; case_code: string; family_name: string; patient_name: string; route_status: string; care_stage: CareStage; approval_status: string; last_barrier_title?: string; unreviewed_notes: number; updated_at: string };
export type CaseDetail = { case: CaseRow & { family_message: string }; family_profile: { relationship: string; phone: string; district: string }; latest_barrier_report?: { status: string; title: string; description: string; availability_note?: string; ai_synthesis?: { summary?: string; items?: Array<{ category: string; text: string }>; missing_information?: string[]; possible_contradictions?: string[]; administrative_action?: string; version?: number }; validation_status?: string; validated_by_professional?: boolean; reviewer_comment?: string }; approval_history: Array<{ decision: string; professional_note: string; created_at: string }>; tasks: Array<{ id: number; title: string; owner: string; status: string; authorized_proposal?: string }>; family_notes: FamilyNote[]; family_notes_summary: FamilyNoteSummary };
export type FeedEvent = { id: number; kind: string; actor: string; message: string; metadata?: Record<string, unknown>; created_at: string };
export type Feed = { events: FeedEvent[]; tasks: CaseDetail['tasks'] };
export type DecisionResult = { decision: { decision: string }; case: CaseRow; task?: CaseDetail['tasks'][number] | null };
export type AgentArtifact = { agent_id: string; summary: string; decision: string; evidence: string[]; confidence: string; requires_approval: boolean; provider?: string; model?: string };
export type OrchestrationRun = { id: string; case_id: number; status: 'queued' | 'running' | 'paused' | 'waiting_approval' | 'completed' | 'failed'; provider: string; model: string; current_agent?: string; proposal?: string; artifacts: AgentArtifact[]; error?: string; created_at: string; updated_at: string };
export type ProvenanceNode = { id: string; kind: string; label: string; actor: string; timestamp: string; origin: string; sensitivity: string; explanation: string; status?: string; metadata: Record<string, unknown> };
export type ProvenanceEdge = { id: string; source: string; target: string; relation: string; explanation: string };
export type ProvenanceGraph = { nodes: ProvenanceNode[]; edges: ProvenanceEdge[] };
