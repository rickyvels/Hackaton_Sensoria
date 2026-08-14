import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  BellSimple, Brain, CaretRight, CheckCircle, CircleNotch, ClipboardText, Compass,
  FlowArrow, Graph, Heartbeat, LockKey, Pause, Play, ShieldCheck, SignIn, Sparkle,
  UsersThree, WarningCircle, XCircle,
} from '@phosphor-icons/react';
import { useReducedMotion } from 'motion/react';
import {
  platformApi, type AgentArtifact, type CaseDetail, type CaseRow, type Feed,
  type OrchestrationRun, type ProvenanceGraph, type Session,
} from './api';

const AmbientShader = lazy(() => import('./AmbientShader'));
const ProvenanceView = lazy(() => import('./ProvenanceGraph'));
const DEMO_CREDENTIALS = import.meta.env.DEV || import.meta.env.VITE_DEMO_CREDENTIALS === 'true';
const DEFAULT_PROPOSAL = 'Buscar cupo en horario de tarde y confirmar con la familia.';
type PlatformSection = 'overview' | 'cases' | 'monitor' | 'trace';
type MonitorFocus = 'orchestrator' | (typeof agentDefinitions)[number]['id'];

const statusLabel = (value: string) => ({
  awaiting_authorization: 'Autorización pendiente', coordination_active: 'Coordinación activa',
  barrier_reported: 'Barrera registrada', scheduled: 'Ruta programada', pending: 'Pendiente de decisión',
  approved: 'Autorizada', rejected: 'Devuelta para revisión', not_requested: 'Sin solicitud',
  queued: 'En cola', running: 'Ejecutando', paused: 'Pausada', waiting_approval: 'Espera autorización',
  completed: 'Completada', failed: 'Detenida de forma segura',
}[value] || value);

const agentDefinitions = [
  { id: 'navigator', name: 'Navegador de Ruta', label: 'Agente de contexto', Icon: Compass, color: 'mint', tool: 'Qwen · lectura de ruta autorizada' },
  { id: 'coordinator', name: 'Coordinador de Atención', label: 'Agente de alternativas', Icon: UsersThree, color: 'amber', tool: 'Qwen · contrato de coordinación' },
  { id: 'followup', name: 'Seguimiento Personalizado', label: 'Agente de continuidad', Icon: BellSimple, color: 'coral', tool: 'Qwen · clasificación y recontacto' },
  { id: 'quality', name: 'Inteligencia y Calidad', label: 'Agente de verificación', Icon: Brain, color: 'violet', tool: 'Qwen · agregación anonimizada' },
] as const;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selected, setSelected] = useState<CaseDetail | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [run, setRun] = useState<OrchestrationRun | null>(null);
  const [graph, setGraph] = useState<ProvenanceGraph | null>(null);
  const [activeSection, setActiveSection] = useState<PlatformSection>('overview');
  const [monitorFocus, setMonitorFocus] = useState<MonitorFocus>('orchestrator');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [proposalDrafts, setProposalDrafts] = useState<Record<number, string>>({});
  const latestRequest = useRef(0);
  const selectedCaseId = useRef<number | null>(null);
  const streamController = useRef<AbortController | null>(null);
  const reduceMotion = Boolean(useReducedMotion());

  useEffect(() => () => streamController.current?.abort(), []);

  const loadCase = async (token: string, id: number, preserveStream = false) => {
    const request = ++latestRequest.current;
    selectedCaseId.current = id;
    if (!preserveStream) streamController.current?.abort();
    setLoading(true);
    setError('');
    try {
      const [detail, nextFeed, currentRun, nextGraph] = await Promise.all([
        platformApi.caseDetail(token, id), platformApi.feed(token, id),
        platformApi.currentRun(token, id), platformApi.graph(token, id),
      ]);
      if (request === latestRequest.current) {
        setSelected(detail); setFeed(nextFeed); setRun(currentRun); setGraph(nextGraph);
        if (currentRun?.proposal) setProposalDrafts((items) => ({ ...items, [id]: items[id] || currentRun.proposal || DEFAULT_PROPOSAL }));
        if (currentRun && ['queued', 'running'].includes(currentRun.status)) {
          const afterId = nextFeed.events.length ? Math.max(...nextFeed.events.map((event) => event.id)) : 0;
          void watchRun(token, currentRun, id, afterId);
        }
      }
    } catch (reason) {
      if (request === latestRequest.current) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el caso.');
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  };

  const watchRun = async (token: string, activeRun: OrchestrationRun, caseId = activeRun.case_id, knownAfterId?: number) => {
    streamController.current?.abort();
    const controller = new AbortController();
    streamController.current = controller;
    setStreaming(true);
    const knownIds = feed?.events.map((event) => event.id) || [];
    const afterId = knownAfterId ?? (knownIds.length ? Math.max(...knownIds) : 0);
    try {
      await platformApi.streamRun(token, activeRun.id, afterId, controller.signal, (event) => {
        if (selectedCaseId.current !== caseId) return;
        setFeed((current) => current ? {
          ...current,
          events: current.events.some((item) => item.id === event.id) ? current.events : [...current.events, event],
        } : current);
        setRun((current) => current?.id === activeRun.id ? {
          ...current,
          status: String(event.metadata?.run_status || current.status) as OrchestrationRun['status'],
          current_agent: String(event.metadata?.agent_id || current.current_agent || ''),
          artifacts: event.metadata?.artifact ? mergeArtifact(current.artifacts, event.metadata.artifact as AgentArtifact) : current.artifacts,
        } : current);
      });
      const latest = await platformApi.run(token, activeRun.id);
      if (selectedCaseId.current !== caseId) return;
      setRun(latest);
      await loadCase(token, caseId, true);
      const refreshedCases = await platformApi.cases(token);
      if (selectedCaseId.current === caseId) setCases(refreshedCases.items);
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Se perdió la conexión con la corrida.');
    } finally {
      if (streamController.current === controller) setStreaming(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    void (async () => {
      try {
        const { items } = await platformApi.cases(session.access_token);
        setCases(items);
        if (!items[0]) return;
        await loadCase(session.access_token, items[0].id);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'No se pudo abrir la plataforma.');
      }
    })();
  }, [session]);

  const playCase = async () => {
    if (!session || !selected || streaming) return;
    const caseId = selected.case.id;
    setError('');
    try {
      const activeRun = run && ['queued', 'running', 'paused'].includes(run.status)
        ? run
        : await platformApi.startRun(session.access_token, caseId);
      if (selectedCaseId.current !== caseId) return;
      setRun(activeRun);
      if (activeRun.status === 'paused') return;
      await watchRun(session.access_token, activeRun, caseId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar la orquestación.');
    }
  };

  const control = async (action: 'pause' | 'resume') => {
    if (!session || !run) return;
    const caseId = run.case_id;
    try {
      const updated = await platformApi.controlRun(session.access_token, run.id, action);
      if (selectedCaseId.current !== caseId) return;
      setRun(updated);
      if (action === 'resume') await watchRun(session.access_token, updated, caseId);
      else streamController.current?.abort();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo controlar la corrida.');
    }
  };

  const decide = async (decision: 'approved' | 'rejected') => {
    if (!session || !selected || !run) return;
    const caseId = selected.case.id;
    const runId = run.id;
    setLoading(true);
    try {
      await platformApi.decide(session.access_token, caseId, {
        decision,
        professional_note: decision === 'approved' ? 'Autorización profesional registrada para coordinación.' : 'Se necesita más contexto antes de coordinar.',
        ...(decision === 'approved' ? { authorized_proposal: proposal } : {}),
      });
      const resumed = await platformApi.run(session.access_token, runId);
      if (selectedCaseId.current !== caseId) return;
      setRun(resumed);
      await watchRun(session.access_token, resumed, caseId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo registrar la decisión.');
    } finally {
      setLoading(false);
    }
  };

  const validateSynthesis = async (decision: 'approved' | 'rejected' | 'clarification_requested', summary: string, comment: string) => {
    if (!session || !selected) return;
    setLoading(true); setError('');
    try {
      const detail = await platformApi.validateSynthesis(session.access_token, selected.case.id, {
        decision, edited_summary: summary, professional_comment: comment,
      });
      if (selectedCaseId.current !== selected.case.id) return;
      setSelected(detail);
      await loadCase(session.access_token, selected.case.id);
      const refreshed = await platformApi.cases(session.access_token);
      setCases(refreshed.items);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo validar la información.');
    } finally { setLoading(false); }
  };

  if (!session) return <ProfessionalLogin onSession={setSession} />;
  const pendingCount = cases.filter((item) => item.approval_status === 'pending').length;
  const proposal = selected ? proposalDrafts[selected.case.id] ?? run?.proposal ?? DEFAULT_PROPOSAL : DEFAULT_PROPOSAL;
  const gateReady = run?.status === 'waiting_approval' && selected?.case.approval_status === 'pending';
  const sectionCopy: Record<PlatformSection, { eyebrow: string; title: string; description: string }> = {
    overview: { eyebrow: 'RESUMEN OPERATIVO', title: 'Ruta de atención', description: 'Muestra la etapa actual, las acciones pendientes y el siguiente paso del caso seleccionado.' },
    cases: { eyebrow: 'GESTIÓN DE CASOS', title: 'Casos y validación', description: 'Permite revisar el aviso original, validar la síntesis y registrar una decisión profesional.' },
    monitor: { eyebrow: 'ORQUESTACIÓN', title: 'Ejecución de agentes', description: 'Muestra qué agente trabaja, la evidencia que utiliza y el control que requiere cada resultado.' },
    trace: { eyebrow: 'TRAZABILIDAD', title: 'Historial y evidencia', description: 'Permite consultar los eventos, artefactos y decisiones registrados durante la coordinación.' },
  };
  const focusedDefinition = agentDefinitions.find((agent) => agent.id === monitorFocus);
  const agentPurpose: Record<string, string> = {
    navigator: 'Revisa el contexto autorizado del caso para identificar el estado de la ruta y la dificultad reportada.',
    coordinator: 'Propone alternativas de coordinación a partir de la información validada por el profesional.',
    followup: 'Prepara el seguimiento y el recontacto después de una decisión autorizada.',
    quality: 'Verifica la trazabilidad de la corrida y reúne datos agregados para control de calidad.',
  };
  const section = activeSection === 'monitor' && focusedDefinition ? { eyebrow: 'AGENTE DE COORDINACIÓN', title: focusedDefinition.name, description: agentPurpose[focusedDefinition.id] } : activeSection === 'monitor' && monitorFocus === 'orchestrator' ? { eyebrow: 'ORQUESTACIÓN', title: 'Orquestador de la ruta', description: 'Ordena la ejecución de los agentes, conserva la traza y detiene el flujo cuando se requiere una decisión profesional.' } : sectionCopy[activeSection];
  const openMonitor = (focus: MonitorFocus) => { setMonitorFocus(focus); setActiveSection('monitor'); };

  return <main className="platform-shell">
    <a className="skip-link" href="#platform-content">Ir al contenido principal</a>
    <aside className="platform-sidebar">
      <div className="platform-brand"><span><Heartbeat weight="fill" /></span><div><strong>Neuroalianza</strong><small>Ruta Viva · Operaciones</small></div></div>
      <nav aria-label="Navegación de plataforma" className="platform-navigation">
        <button className={activeSection === 'overview' ? 'nav-active' : ''} aria-current={activeSection === 'overview' ? 'page' : undefined} onClick={() => setActiveSection('overview')}><FlowArrow /> Inicio</button>
        <button className={activeSection === 'cases' ? 'nav-active' : ''} aria-current={activeSection === 'cases' ? 'page' : undefined} onClick={() => setActiveSection('cases')}><UsersThree /> Casos <em>{cases.length}</em></button>
        <div className={`nav-agent-group ${activeSection === 'monitor' ? 'nav-agent-group-active' : ''}`}><button className={activeSection === 'monitor' && monitorFocus === 'orchestrator' ? 'nav-active' : ''} aria-current={activeSection === 'monitor' && monitorFocus === 'orchestrator' ? 'page' : undefined} onClick={() => openMonitor('orchestrator')}><Sparkle /> Orquestación</button><div className="nav-agent-subsections" aria-label="Agentes de la ruta">{agentDefinitions.map((agent) => <button key={agent.id} className={activeSection === 'monitor' && monitorFocus === agent.id ? 'nav-sub-active' : ''} aria-current={activeSection === 'monitor' && monitorFocus === agent.id ? 'page' : undefined} onClick={() => openMonitor(agent.id)}><agent.Icon weight="duotone" /><span>{agent.name}</span><i aria-label="Ver estado" /></button>)}</div></div>
        <button className={activeSection === 'trace' ? 'nav-active' : ''} aria-current={activeSection === 'trace' ? 'page' : undefined} onClick={() => setActiveSection('trace')}><Graph /> Historial de la ruta</button>
      </nav>
      <div className="sidebar-system"><span className="system-dot" /> Ruta lista para coordinar<br /><small>{run ? statusLabel(run.status) : 'Atención centrada en el siguiente paso'}</small></div>
      <div className="sidebar-note"><ShieldCheck weight="fill" /> Ningún agente modifica una ruta sin la decisión registrada de un profesional.</div>
      <button className="logout" onClick={() => { streamController.current?.abort(); setSession(null); }}>Cerrar sesión</button>
    </aside>
    <section className="platform-main" id="platform-content" tabIndex={-1}>
      <header className="platform-header"><div><p>{section.eyebrow}</p><h1>{section.title}</h1><span>{section.description}</span></div><div className="professional-badge"><span>{session.user.full_name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><div><strong>{session.user.full_name}</strong><small>Profesional responsable</small></div></div></header>
      <nav aria-label="Navegación de plataforma" className="mobile-platform-navigation">
        <button className={activeSection === 'overview' ? 'nav-active' : ''} aria-current={activeSection === 'overview' ? 'page' : undefined} onClick={() => setActiveSection('overview')}><FlowArrow /> Inicio</button>
        <button className={activeSection === 'cases' ? 'nav-active' : ''} aria-current={activeSection === 'cases' ? 'page' : undefined} onClick={() => setActiveSection('cases')}><UsersThree /> Casos</button>
        <button className={activeSection === 'monitor' ? 'nav-active' : ''} aria-current={activeSection === 'monitor' ? 'page' : undefined} onClick={() => openMonitor('orchestrator')}><Sparkle /> Coordinación</button>
        <button className={activeSection === 'trace' ? 'nav-active' : ''} aria-current={activeSection === 'trace' ? 'page' : undefined} onClick={() => setActiveSection('trace')}><Graph /> Historial</button>
      </nav>
      {error ? <div className="platform-error" role="alert"><WarningCircle weight="fill" />{error}</div> : null}
      <PlatformContent
        section={activeSection} cases={cases} selected={selected} feed={feed} run={run} graph={graph} loading={loading} streaming={streaming}
        pendingCount={pendingCount} proposal={proposal} gateReady={gateReady} reduceMotion={reduceMotion}
        onChooseCase={(id) => { setActiveSection('cases'); void loadCase(session.access_token, id); }}
        onOpenCases={() => setActiveSection('cases')} onOpenMonitor={() => openMonitor('orchestrator')} onOpenTrace={() => setActiveSection('trace')}
        onPlay={() => void playCase()} onPause={() => void control('pause')} onResume={() => void control('resume')}
        onDecide={(decision) => void decide(decision)}
        onValidateSynthesis={(decision, summary, comment) => void validateSynthesis(decision, summary, comment)}
        onProposalChange={(value) => selected && setProposalDrafts((drafts) => ({ ...drafts, [selected.case.id]: value }))} monitorFocus={monitorFocus}
      />
    </section>
  </main>;
}

function mergeArtifact(current: AgentArtifact[], incoming: AgentArtifact) {
  return [...current.filter((item) => item.agent_id !== incoming.agent_id), incoming];
}

function PlatformContent({ section, cases, selected, feed, run, graph, loading, streaming, pendingCount, proposal, gateReady, reduceMotion, onChooseCase, onOpenCases, onOpenMonitor, onOpenTrace, onPlay, onPause, onResume, onDecide, onValidateSynthesis, onProposalChange, monitorFocus }: {
  section: PlatformSection; cases: CaseRow[]; selected: CaseDetail | null; feed: Feed | null; run: OrchestrationRun | null; graph: ProvenanceGraph | null;
  loading: boolean; streaming: boolean; pendingCount: number; proposal: string; gateReady: boolean; reduceMotion: boolean;
  onChooseCase: (id: number) => void; onOpenCases: () => void; onOpenMonitor: () => void; onOpenTrace: () => void;
  onPlay: () => void; onPause: () => void; onResume: () => void; onDecide: (decision: 'approved' | 'rejected') => void; onProposalChange: (value: string) => void;
  onValidateSynthesis: (decision: 'approved' | 'rejected' | 'clarification_requested', summary: string, comment: string) => void;
  monitorFocus: MonitorFocus;
}) {
  if (loading && !selected) return <div className="platform-loader"><CircleNotch className="spin" /> Cargando información…</div>;
  if (!selected) return <div className="platform-loader">No hay casos para mostrar.</div>;
  const hasBarrier = Boolean(selected.latest_barrier_report && selected.latest_barrier_report.status === 'pending_review');
  if (section === 'overview') return <section className="section-stack overview-clarity" aria-label="Resumen de la ruta de atención">
    <section className="overview-command"><div className="overview-next-action"><p>QUÉ HACER AHORA</p><h2>{selected.latest_barrier_report?.validation_status === 'pending_validation' ? 'Revisar la síntesis antes de activar agentes.' : gateReady ? 'Decidir el siguiente paso propuesto.' : selected.latest_barrier_report ? 'La ruta tiene una dificultad registrada.' : 'La ruta está lista para acompañar.'}</h2><span>{selected.latest_barrier_report?.validation_status === 'pending_validation' ? 'La información original se conserva. Tu validación desbloquea la coordinación.' : selected.latest_barrier_report?.title || 'No hay una dificultad pendiente en este caso.'}</span><button onClick={onOpenCases}>{selected.latest_barrier_report?.validation_status === 'pending_validation' ? 'Abrir síntesis' : gateReady ? 'Revisar propuesta' : 'Ver caso'} <CaretRight /></button></div><SynthesisSnapshot selected={selected} /></section>
    <section className="platform-kpis" aria-label="Resumen operativo"><Metric label="Rutas por continuar" value={String(cases.filter((item) => item.route_status === 'coordination_active').length)} note="casos con seguimiento activo" /><Metric label="Decisiones pendientes" value={String(pendingCount)} accent="amber" note={pendingCount ? 'requieren revisión profesional' : 'no tienes decisiones pendientes'} /><Metric label="Etapa actual" value={routeStage(selected)} text note="para el caso seleccionado" /></section>
    <CareRoute selected={selected} compact onOpenCase={onOpenCases} />
    <AgentOverview run={run} onOpenMonitor={onOpenMonitor} />
  </section>;
  if (section === 'cases') return <section className="cases-page"><CaseList cases={cases} selectedId={selected.case.id} onChoose={onChooseCase} /><CaseDecisionWorkspace selected={selected} run={run} proposal={proposal} gateReady={gateReady} loading={loading} onProposalChange={onProposalChange} onDecide={onDecide} onValidateSynthesis={onValidateSynthesis} onOpenMonitor={onOpenMonitor} onOpenTrace={onOpenTrace} /></section>;
  if (section === 'monitor') return <section className="section-stack"><CaseFocus selected={selected} run={run} /><AgentMonitor focus={monitorFocus} run={run} feed={feed} onPlay={onPlay} onPause={onPause} onResume={onResume} onOpenTrace={onOpenTrace} streaming={streaming} reduceMotion={reduceMotion} hasBarrier={hasBarrier} /></section>;
  if (section === 'trace') return <section className="trace-page"><CaseFocus selected={selected} run={run} />{graph ? <Suspense fallback={<div className="platform-loader">Preparando historial…</div>}><ProvenanceView graph={graph} reduceMotion={reduceMotion} /></Suspense> : <div className="platform-loader">Aún no hay trazabilidad disponible.</div>}</section>;
  return null;
}

function routeStage(selected: CaseDetail) {
  if (selected.tasks.length) return 'Siguiente paso autorizado';
  if (selected.case.approval_status === 'pending') return 'Revisión profesional';
  if (selected.latest_barrier_report) return 'Dificultad registrada';
  return 'Orientación inicial';
}

function SynthesisSnapshot({ selected }: { selected: CaseDetail }) {
  const report = selected.latest_barrier_report;
  const awaiting = report?.validation_status === 'pending_validation';
  const validated = report?.validated_by_professional;
  return <article className={`synthesis-snapshot ${awaiting ? 'snapshot-pending' : ''}`}><div><span className="snapshot-icon"><Sparkle weight="fill" /></span><p>SÍNTESIS DEL CASO</p><h3>{awaiting ? 'Pendiente de revisión profesional' : validated ? 'Información validada' : 'Sin síntesis pendiente'}</h3><small>{awaiting ? 'Original + síntesis estructurada + control humano' : validated ? 'Los agentes pueden trabajar con esta versión.' : 'Aparecerá cuando la familia o el equipo registre información.'}</small></div><b>{awaiting ? '1 acción' : validated ? 'Validada' : 'En espera'}</b></article>;
}

function AgentOverview({ run, onOpenMonitor }: { run: OrchestrationRun | null; onOpenMonitor: () => void }) {
  const active = run?.current_agent;
  return <section className="agent-overview" aria-labelledby="agent-overview-title"><div className="agent-overview-heading"><div><p>ORQUESTACIÓN</p><h2 id="agent-overview-title">Agentes de coordinación</h2><span>Muestra el estado de cada agente y permite abrir el detalle de su trabajo y su evidencia.</span></div><button onClick={onOpenMonitor}>Ver agentes <CaretRight /></button></div><ol>{agentDefinitions.map((agent, index) => { const finished = Boolean(run?.artifacts.find((artifact) => artifact.agent_id === agent.id)); const working = active === agent.id && ['running', 'queued'].includes(run?.status || ''); const state = finished ? 'Resultado listo' : working ? 'Trabajando' : 'En espera'; return <li className={`agent-overview-step ${agent.color} ${working ? 'is-working' : ''}`} key={agent.id}><span><agent.Icon weight="duotone" /></span><div><small>{index + 1}. {agent.label}</small><strong>{agent.name}</strong><em>{state}</em></div></li>; })}</ol></section>;
}

function CareRoute({ selected, compact = false, onOpenCase }: { selected: CaseDetail; compact?: boolean; onOpenCase?: () => void }) {
  const current = selected.tasks.length ? 3 : selected.case.approval_status === 'pending' ? 2 : selected.latest_barrier_report ? 1 : 0;
  const steps = [
    ['Orientación inicial', 'La familia y el primer nivel pueden conocer los pasos de la ruta.'],
    ['Dificultad registrada', 'Se registra una señal o una dificultad para no interrumpir la atención.'],
    ['Revisión profesional', 'El equipo responsable revisa la información antes de autorizar una acción.'],
    ['Siguiente paso autorizado', 'Una decisión registrada permite crear una tarea o coordinación concreta.'],
    ['Seguimiento con la familia', 'La familia recibe la confirmación y puede reportar nuevas dificultades.'],
  ];
  return <section className={`care-route ${compact ? 'care-route-compact' : ''}`} aria-label="Etapas de la ruta de atención"><div className="care-route-heading"><div><p>RUTA DE ATENCIÓN</p><h2>{compact ? `Etapa actual: ${routeStage(selected)}` : `La ruta de ${selected.case.patient_name}`}</h2>{compact ? null : <span>La herramienta acompaña el proceso; no confirma diagnósticos, referencias ni evaluaciones que el caso no haya registrado.</span>}</div>{onOpenCase ? <button onClick={onOpenCase}>Ver caso <CaretRight /></button> : null}</div><ol>{steps.map(([label, detail], index) => <li className={index < current ? 'route-complete' : index === current ? 'route-current' : ''} aria-current={index === current ? 'step' : undefined} key={label}><span>{index < current ? <><CheckCircle weight="fill" /><span className="visually-hidden">Completada</span></> : index + 1}</span><div><strong>{label}</strong>{compact ? null : <small>{detail}</small>}</div></li>)}</ol></section>;
}

function CaseList({ cases, selectedId, onChoose }: { cases: CaseRow[]; selectedId: number; onChoose: (id: number) => void }) {
  return <section className="case-list" aria-label="Lista de casos"><div className="section-title"><div><p>CASOS DISPONIBLES</p><h2>Rutas</h2></div><span>{cases.length}</span></div>{cases.map((item) => <button className={`case-row ${selectedId === item.id ? 'case-row-active' : ''}`} onClick={() => onChoose(item.id)} key={item.id}><span className="case-initial">{item.patient_name[0]}</span><span><strong>{item.patient_name}</strong><small>{item.case_code}</small></span><em>{statusLabel(item.approval_status)}</em><CaretRight /></button>)}</section>;
}

function CaseFocus({ selected, run }: { selected: CaseDetail; run: OrchestrationRun | null }) {
  return <section className="case-focus"><div><p>CASO {selected.case.case_code}</p><h2>{selected.case.patient_name}</h2><span>{selected.family_profile.relationship} · {selected.family_profile.district} · Identidad protegida</span></div><span className={`status-badge status-${selected.case.approval_status}`}>{statusLabel(run?.status || selected.case.approval_status)}</span></section>;
}

function CaseDecisionWorkspace({ selected, run, proposal, gateReady, loading, onProposalChange, onDecide, onValidateSynthesis, onOpenMonitor, onOpenTrace }: { selected: CaseDetail; run: OrchestrationRun | null; proposal: string; gateReady: boolean; loading: boolean; onProposalChange: (value: string) => void; onDecide: (decision: 'approved' | 'rejected') => void; onValidateSynthesis: (decision: 'approved' | 'rejected' | 'clarification_requested', summary: string, comment: string) => void; onOpenMonitor: () => void; onOpenTrace: () => void }) {
  const nextAction = selected.case.approval_status === 'pending'
    ? <section className={`decision-panel ${gateReady ? 'decision-ready' : ''}`}><div className="gate-symbol"><LockKey weight="fill" /></div><div className="decision-copy"><p>DECISIÓN PROFESIONAL</p><h3>{gateReady ? 'El siguiente paso está listo para tu revisión.' : 'La información del caso está siendo organizada.'}</h3><span>{gateReady ? 'Puedes ajustar la propuesta, aprobarla o devolverla para una nueva revisión.' : 'No se creará ninguna tarea hasta que exista una decisión registrada.'}</span></div><label><span>Acción propuesta</span><textarea value={proposal} onChange={(event) => onProposalChange(event.target.value)} disabled={!gateReady} /></label><div className="decision-actions"><button className="reject" disabled={loading || !gateReady} onClick={() => onDecide('rejected')}><XCircle weight="fill" />Devolver para revisión</button><button className="approve" disabled={loading || !gateReady} onClick={() => onDecide('approved')}><CheckCircle weight="fill" />Aprobar y crear tarea</button></div></section>
    : <section className="task-card"><CheckCircle weight="fill" /><div><p>{selected.tasks.length ? 'SIGUIENTE PASO CONFIRMADO' : 'SIGUIENTE PASO'}</p><h3>{selected.tasks[0]?.title || (run?.status === 'completed' ? 'La revisión terminó sin crear una tarea.' : 'Aún no hay una acción pendiente.')}</h3><span>{selected.tasks[0]?.authorized_proposal || selected.case.family_message}</span></div></section>;
  const pendingSynthesis = selected.latest_barrier_report?.validation_status === 'pending_validation';
  return <section className="case-workbench" id="workbench"><CaseFocus selected={selected} run={run} />{pendingSynthesis ? <SynthesisReview report={selected.latest_barrier_report!} loading={loading} onValidate={onValidateSynthesis} /> : <><>{nextAction}</><article className="barrier-card"><div className="card-heading"><span>INFORMACIÓN ORIGINAL</span><WarningCircle weight="fill" /></div><h3>{selected.latest_barrier_report?.title || 'No hay una dificultad pendiente'}</h3><p>{selected.latest_barrier_report?.description || 'La ruta se encuentra al día.'}</p>{selected.latest_barrier_report?.availability_note ? <small>Disponibilidad: {selected.latest_barrier_report.availability_note}</small> : null}</article><CareRoute selected={selected} compact /><div className="case-action-row"><button onClick={onOpenMonitor}><Sparkle weight="fill" /> Ver coordinación</button><button onClick={onOpenTrace}><Graph weight="fill" /> Historial de la ruta</button></div></>}</section>;
}

function SynthesisReview({ report, loading, onValidate }: { report: NonNullable<CaseDetail['latest_barrier_report']>; loading: boolean; onValidate: (decision: 'approved' | 'rejected' | 'clarification_requested', summary: string, comment: string) => void }) {
  const synthesis = report.ai_synthesis || {};
  const [summary, setSummary] = useState(synthesis.summary || report.description);
  const [comment, setComment] = useState('Información revisada por profesional.');
  return <section className="synthesis-review" aria-labelledby="synthesis-title"><div className="synthesis-heading"><span><Sparkle weight="fill" /></span><div><p>CAPA DE SÍNTESIS Y VALIDACIÓN</p><h2 id="synthesis-title">Validación de la síntesis</h2><span>Permite comparar el aviso original con la síntesis antes de iniciar la coordinación.</span></div></div><div className="synthesis-grid"><section className="synthesis-source"><h3>1. Aviso original de la familia</h3><p>{report.description}</p><small>Disponibilidad: {report.availability_note || 'Sin dato adicional registrado.'}</small></section><section className="synthesis-editor"><h3>2. Ajusta la síntesis si hace falta</h3><label><span>Resumen que verán los agentes</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} /></label>{synthesis.items?.map((item) => <p className="synthesis-item" key={`${item.category}-${item.text}`}><strong>{item.category}</strong>{item.text}</p>)}</section><section className="synthesis-check"><div><h3>3. Confirma lo revisado</h3><ul><li>{synthesis.missing_information?.[0] || 'No se identificó información faltante.'}</li><li>{synthesis.administrative_action || 'Sin acción administrativa pendiente.'}</li></ul></div><label><span>Comentario profesional</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} /></label></section></div><div className="synthesis-actions"><button className="reject" disabled={loading} onClick={() => onValidate('clarification_requested', summary, comment)}>Pedir aclaración</button><button className="reject" disabled={loading} onClick={() => onValidate('rejected', summary, comment)}>Rechazar síntesis</button><button className="approve" disabled={loading || comment.trim().length < 3} onClick={() => onValidate('approved', summary, comment)}><CheckCircle weight="fill" />Validar y habilitar agentes</button></div></section>;
}

function AgentMonitor({ focus, run, feed, onPlay, onPause, onResume, onOpenTrace, streaming, reduceMotion, hasBarrier }: { focus: MonitorFocus; run: OrchestrationRun | null; feed: Feed | null; onPlay: () => void; onPause: () => void; onResume: () => void; onOpenTrace: () => void; streaming: boolean; reduceMotion: boolean; hasBarrier: boolean }) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('navigator');
  useEffect(() => { if (focus !== 'orchestrator') setSelectedAgentId(focus); }, [focus]);
  const runEvents = useMemo(() => feed?.events.filter((event) => event.metadata?.run_id === run?.id) || [], [feed, run?.id]);
  const agents = agentDefinitions.map((agent) => {
    const artifact = run?.artifacts.find((item) => item.agent_id === agent.id);
    const agentEvents = runEvents.filter((event) => event.metadata?.agent_id === agent.id);
    const latest = agentEvents[agentEvents.length - 1];
    const state = artifact ? 'completed' : latest?.metadata?.status === 'working' ? 'working' : run?.status === 'failed' && run.current_agent === agent.id ? 'failed' : 'waiting';
    return { ...agent, artifact, state };
  });
  const focused = agents.find((agent) => agent.id === selectedAgentId) || agents[0];
  const canPlay = hasBarrier && (!run || run.status === 'failed');
  const running = run?.status === 'running' || run?.status === 'queued';
  return <section className="agent-monitor" aria-labelledby="agent-monitor-title"><div className="monitor-heading"><div><p>ASISTENCIA PARA LA COORDINACIÓN</p><h2 id="agent-monitor-title">Proceso de coordinación</h2><span>Muestra el estado, la evidencia y el control aplicados en cada paso. Los agentes no modifican la ruta ni toman decisiones clínicas.</span></div><div className="trace-controls"><button onClick={onPlay} disabled={!canPlay || streaming} className="trace-play"><Play weight="fill" />{streaming ? 'Preparando propuesta' : canPlay ? 'Reproducir caso' : run ? statusLabel(run.status) : 'Sin dificultad pendiente'}</button>{running ? <button onClick={onPause} className="trace-secondary"><Pause weight="fill" />Pausar</button> : null}{run?.status === 'paused' ? <button onClick={onResume} className="trace-secondary"><Play weight="fill" />Continuar</button> : null}<button onClick={onOpenTrace} className="trace-secondary"><Graph weight="fill" />Ver historial</button></div></div><div className="monitor-status" role="status"><span className={`runtime-dot runtime-${run?.status || 'idle'}`} /><strong>{run ? statusLabel(run.status) : 'Lista para iniciar'}</strong><span>{run?.status === 'waiting_approval' ? 'La propuesta está lista; el equipo responsable debe confirmar el siguiente paso.' : 'La asistencia solo se activa cuando pulsas “Reproducir caso”.'}</span></div><div className="agent-steps" aria-label="Pasos de coordinación">{agents.map((agent, index) => <button key={agent.id} className={`agent-step ${agent.state} ${focused.id === agent.id ? 'agent-step-selected' : ''}`} aria-pressed={focused.id === agent.id} onClick={() => setSelectedAgentId(agent.id)}><span>{index + 1}</span><div><small>{agent.label}</small><strong>{agent.name}</strong></div><b>{agent.state === 'completed' ? 'Listo' : agent.state === 'working' ? 'En curso' : agent.state === 'failed' ? 'Revisar' : 'En espera'}</b></button>)}</div><article className={`agent-detail agent-detail-${focused.color}`}><div className="agent-detail-heading"><AgentPet agent={focused} reduceMotion={reduceMotion} /><div><small>{focused.label}</small><h3>{focused.name}</h3></div><b>{focused.state === 'completed' ? 'Paso terminado' : focused.state === 'working' ? 'Revisando ahora' : 'A la espera'}</b></div>{focused.artifact ? <div className="agent-detail-body"><section><h4>Qué revisó</h4><p>{focused.artifact.summary}</p></section><section><h4>Qué propone</h4><p>{focused.artifact.decision}</p></section><section><h4>En qué se basa</h4><ul>{focused.artifact.evidence.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h4>Siguiente control</h4><p>{focused.artifact.requires_approval ? 'La propuesta necesita una decisión profesional antes de crear una tarea.' : 'El resultado queda registrado y pasa al siguiente paso de coordinación.'}</p></section></div> : <div className="agent-detail-empty"><Compass weight="duotone" /><p>{focused.state === 'working' ? 'Está organizando la información autorizada del caso.' : 'Este paso comenzará cuando termine el evento anterior.'}</p></div>}</article>{reduceMotion ? <p className="motion-note">Movimiento reducido activo: los cambios se muestran con texto y estado.</p> : null}</section>;
}

function AgentPet({ agent, reduceMotion }: { agent: (typeof agentDefinitions)[number] & { state: string }; reduceMotion: boolean }) {
  return <span className={`agent-pet agent-pet-${agent.color} agent-pet-${agent.state} ${reduceMotion ? 'agent-pet-still' : ''}`} role="img" aria-label={`${agent.name}: ${agent.state === 'working' ? 'trabajando' : agent.state === 'completed' ? 'paso terminado' : 'en espera'}`}><agent.Icon weight="duotone" /><i /><i /></span>;
}

function AgentTrace({ run, feed, onPlay, onPause, onResume, onGraph, streaming, reduceMotion, approvalStatus, hasBarrier }: {
  run: OrchestrationRun | null; feed: Feed | null; onPlay: () => void; onPause: () => void; onResume: () => void;
  onGraph: () => void; streaming: boolean; reduceMotion: boolean; approvalStatus: string; hasBarrier: boolean;
}) {
  const runEvents = useMemo(() => feed?.events.filter((event) => event.metadata?.run_id === run?.id) || [], [feed, run?.id]);
  const artifacts = run?.artifacts || [];
  const agents = agentDefinitions.map((agent) => {
    const artifact = artifacts.find((item) => item.agent_id === agent.id);
    const events = runEvents.filter((event) => event.metadata?.agent_id === agent.id);
    const latest = events[events.length - 1];
    const state = artifact ? 'completed' : latest?.metadata?.status === 'working' ? 'working' : run?.status === 'failed' && run.current_agent === agent.id ? 'failed' : 'waiting';
    const effectiveTool = artifact?.provider && artifact?.model
      ? `${artifact.provider} · ${artifact.model}`
      : agent.tool;
    return { ...agent, artifact, state, tool: effectiveTool };
  });
  const active = agents.find((agent) => agent.id === run?.current_agent);
  const canPlay = hasBarrier && (!run || run.status === 'failed');
  const running = run?.status === 'running' || run?.status === 'queued';

  return <section className="agent-trace" aria-labelledby="trace-title">
    <div className="trace-heading"><div><p>EJECUCIÓN REAL · TRAZA MULTIAGENTE</p><h3 id="trace-title">El trabajo ocurre a la vista</h3><span>Eventos persistidos del backend. Qwen propone artefactos; el orquestador valida y una persona decide.</span></div><div className="trace-controls"><button onClick={onPlay} disabled={!canPlay || streaming} className="trace-play"><Play weight="fill" />{streaming ? 'Observando ejecución' : canPlay ? 'Reproducir caso' : run ? statusLabel(run.status) : 'Sin barrera pendiente'}</button>{running ? <button onClick={onPause} className="trace-secondary"><Pause weight="fill" />Pausar</button> : null}{run?.status === 'paused' ? <button onClick={onResume} className="trace-secondary"><Play weight="fill" />Continuar</button> : null}<button onClick={onGraph} className="trace-secondary"><Graph weight="fill" />Ver grafo</button></div></div>
    <div className="runtime-strip"><span className={`runtime-dot runtime-${run?.status || 'idle'}`} /><strong>{run ? statusLabel(run.status) : 'Lista para iniciar'}</strong><small>{run ? `solicitado: ${run.provider} · ${run.model} · corrida ${run.id.slice(0, 8)}` : 'El modelo se invoca únicamente al reproducir el caso.'}</small></div>
    <div className="agent-network" aria-live="polite" aria-atomic="false"><div className={`signal-beam ${running && !reduceMotion ? 'signal-active' : ''}`} />{agents.map((agent) => <article className={`agent-node ${agent.color} agent-${agent.state}`} key={agent.id}><span className="agent-icon"><agent.Icon weight="duotone" /></span><div className="agent-identity"><small>{agent.label}</small><strong>{agent.name}</strong></div><b className="agent-state">{{ completed: 'Trabajo completado', working: 'Trabajando ahora', failed: 'Fallo seguro', waiting: 'En espera' }[agent.state]}</b><dl><div><dt>Entrada</dt><dd>{agent.artifact ? 'Contexto mínimo autorizado del caso' : 'A la espera del evento anterior'}</dd></div><div><dt>Herramienta</dt><dd>{agent.tool}</dd></div><div><dt>Salida</dt><dd>{agent.artifact?.summary || 'Sin salida todavía'}</dd></div><div><dt>Evidencia</dt><dd>{agent.artifact?.evidence.join(' · ') || 'Se registrará con el artefacto'}</dd></div><div><dt>Confianza</dt><dd>{agent.artifact?.confidence || 'Pendiente'}</dd></div><div><dt>Autorización</dt><dd>{agent.artifact ? agent.artifact.requires_approval ? 'Requiere decisión humana' : 'Solo propone; no modifica' : 'Pendiente'}</dd></div></dl></article>)}</div>
    <div className="trace-console" role="status"><Sparkle weight="fill" /><div><strong>{run?.status === 'failed' ? 'Ejecución detenida de forma segura' : active ? `${active.name}: ${statusLabel(run?.status || '')}` : 'Orquestador en espera'}</strong><span>{run?.error || active?.artifact?.decision || 'Selecciona “Reproducir caso” para crear una corrida real y observable.'}</span></div></div>
    <div className={`human-gate ${run?.status === 'waiting_approval' ? 'gate-ready' : ''}`}><span><LockKey weight="fill" /></span><div><small>COMPUERTA HUMANA SEPARADA</small><strong>{approvalStatus === 'pending' ? 'Solicitud lista para tu decisión' : statusLabel(approvalStatus)}</strong></div><b>{approvalStatus === 'pending' ? 'Aprobar, ajustar o rechazar abajo' : 'Sin cambios no autorizados'}</b></div>
  </section>;
}

function ProfessionalLogin({ onSession }: { onSession: (session: Session) => void }) {
  const [dni, setDni] = useState(DEMO_CREDENTIALS ? '87654321' : '');
  const [password, setPassword] = useState(DEMO_CREDENTIALS ? 'profesional123' : '');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const [shaderReady, setShaderReady] = useState(false); const reduceMotion = useReducedMotion();
  useEffect(() => { if (reduceMotion) return; const id = window.setTimeout(() => setShaderReady(true), 900); return () => window.clearTimeout(id); }, [reduceMotion]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); setError(''); try { const session = await platformApi.login(dni, password); if (session.user.role !== 'professional') throw new Error('Este acceso es solo para profesionales.'); onSession(session); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.'); } finally { setLoading(false); } };
  return <main className="login-screen"><section className="login-panel"><div className="login-brand"><Heartbeat weight="fill" /> Neuroalianza <span>Ruta Viva</span></div><p>ACCESO PROFESIONAL</p><h1>Acceso a casos y decisiones</h1><span>Ingresa para revisar casos, validar información y registrar decisiones. Los datos de esta demostración son sintéticos.</span><form onSubmit={submit}><label>DNI<input inputMode="numeric" autoComplete="username" value={dni} onChange={(event) => setDni(event.target.value)} /></label><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error ? <div className="login-error">{error}</div> : null}<button disabled={loading}><SignIn weight="bold" />{loading ? 'Ingresando…' : 'Entrar a la plataforma'}</button></form></section><aside className="login-aside"><div className="login-shader" aria-hidden="true">{shaderReady ? <Suspense fallback={null}><AmbientShader /></Suspense> : null}</div><div className="login-aside-content"><span className="login-aside-mark">01 / 04</span><h2>Flujo de validación y coordinación</h2><p>Muestra el aviso familiar, la información validada, la decisión profesional y el siguiente paso registrado.</p><div className="login-aside-route"><span>Señal familiar</span><i /><span>Validación profesional</span><i /><span>Tarea autorizada</span></div></div></aside></main>;
}

function Metric({ label, value, accent, text, note }: { label: string; value: string; accent?: string; text?: boolean; note: string }) {
  return <article className={`metric ${accent || ''}`}><span>{label}</span><strong className={text ? 'metric-text' : ''}>{value}</strong><small>{note}</small></article>;
}
