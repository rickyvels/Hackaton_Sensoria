import { useEffect, useMemo, useRef, useState } from 'react';
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';
import { ClockCounterClockwise, Cpu, FlowArrow, GitBranch, LockKey, Pulse, ShieldCheck } from '@phosphor-icons/react';
import '@xyflow/react/dist/style.css';
import type { ProvenanceGraph as GraphData, ProvenanceNode } from './api';
import { buildRunSummary, formatDuration, layoutCausalGraph, runNodes, selectTraceGraph } from './observability';

const kindColor: Record<string, string> = {
  Case: '#155c60', OrchestrationRun: '#0d756e', FamilyReport: '#168b81', Barrier: '#b87921',
  AgentExecution: '#6554a5', AgentProposal: '#277154', PolicyCheck: '#b45a46',
  ApprovalRequest: '#a66c1b', ApprovalDecision: '#286d4e', Task: '#0d756e',
  Notification: '#3b6f8f', RouteState: '#446b70', AggregateMetric: '#6d58a5',
  SynthesisGenerated: '#397d9c', SynthesisValidation: '#187864', OrchestratorGate: '#be7d1f',
};

const kindLabel: Record<string, string> = {
  Case: 'Caso', OrchestrationRun: 'Corrida', FamilyReport: 'Aviso familiar', Barrier: 'Barrera',
  AgentExecution: 'Ejecución del agente', AgentProposal: 'Artefacto producido', PolicyCheck: 'Control de política',
  ApprovalRequest: 'Solicitud de autorización', ApprovalDecision: 'Decisión profesional', Task: 'Tarea creada',
  Notification: 'Notificación', RouteState: 'Estado de ruta', AggregateMetric: 'Métrica agregada',
  SynthesisGenerated: 'Síntesis preparada', SynthesisValidation: 'Revisión profesional', OrchestratorGate: 'Agentes habilitados',
};

type ViewMode = 'graph' | 'timeline' | 'artifacts';
type TimelineFilter = 'all' | 'agents' | 'policy' | 'human' | 'errors';

export default function ProvenanceGraph({ graph, reduceMotion }: { graph: GraphData; reduceMotion: boolean }) {
  const availableRuns = useMemo(() => runNodes(graph), [graph]);
  const [selectedRun, setSelectedRun] = useState<string | null>(() => String(availableRuns[0]?.metadata.run_id || '') || null);
  const [selected, setSelected] = useState<ProvenanceNode | null>(null);
  // La cronología es la lectura más directa para una persona profesional.
  // El grafo conserva el detalle causal, pero no obliga a empezar por él.
  const [view, setView] = useState<ViewMode>('timeline');
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!availableRuns.length) { setSelectedRun(null); return; }
    if (!availableRuns.some((node) => node.metadata.run_id === selectedRun)) {
      setSelectedRun(String(availableRuns[0].metadata.run_id));
    }
  }, [availableRuns, selectedRun]);

  const trace = useMemo(() => selectTraceGraph(graph, selectedRun), [graph, selectedRun]);
  const summary = useMemo(() => buildRunSummary(graph, selectedRun), [graph, selectedRun]);
  const positions = useMemo(() => layoutCausalGraph(trace), [trace]);
  const relatedIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const ids = new Set([selected.id]);
    trace.edges.forEach((edge) => {
      if (edge.source === selected.id) ids.add(edge.target);
      if (edge.target === selected.id) ids.add(edge.source);
    });
    return ids;
  }, [selected, trace.edges]);

  const nodes = useMemo<Node[]>(() => trace.nodes.map((node) => ({
    id: node.id,
    position: positions[node.id] || { x: 0, y: 0 },
    data: { label: `${kindLabel[node.kind] || node.kind}\n${node.actor}\n${node.status || 'registrado'}` },
    ariaLabel: `${kindLabel[node.kind] || node.kind}, ${node.actor}, estado ${node.status || 'registrado'}`,
    focusable: true,
    style: {
      width: 205, borderRadius: 14,
      border: `1px solid ${kindColor[node.kind] || '#719390'}`,
      borderLeft: `4px solid ${kindColor[node.kind] || '#719390'}`,
      background: selected?.id === node.id ? '#f1fffb' : '#ffffffed', color: '#173f43', padding: 11,
      fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-line',
      opacity: selected && !relatedIds.has(node.id) ? .42 : 1,
      boxShadow: selected?.id === node.id ? '0 0 0 3px rgb(21 148 134 / 16%)' : '0 8px 22px rgb(17 57 64 / 9%)',
      transition: reduceMotion ? 'none' : 'opacity 160ms ease, box-shadow 160ms ease',
    },
  })), [positions, reduceMotion, relatedIds, selected, trace.nodes]);

  const edges = useMemo<Edge[]>(() => trace.edges.map((edge) => {
    const highlighted = selected && (edge.source === selected.id || edge.target === selected.id);
    return {
      id: edge.id, source: edge.source, target: edge.target, label: edge.relation,
      animated: false, markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: highlighted ? '#0d8279' : '#80aaa6', strokeWidth: highlighted ? 2.5 : 1.3, opacity: selected && !highlighted ? .3 : 1 },
      labelStyle: { fill: highlighted ? '#0b655f' : '#557274', fontSize: 10, fontWeight: highlighted ? 700 : 500 },
    };
  }), [selected, trace.edges]);

  const timeline = useMemo(() => trace.nodes
    .filter((node) => node.kind !== 'Case' && node.kind !== 'OrchestrationRun')
    .filter((node) => {
      if (timelineFilter === 'agents') return ['AgentExecution', 'AgentProposal'].includes(node.kind);
      if (timelineFilter === 'policy') return node.kind === 'PolicyCheck';
      if (timelineFilter === 'human') return ['ApprovalRequest', 'ApprovalDecision'].includes(node.kind);
      if (timelineFilter === 'errors') return node.status === 'failed' || node.metadata.status === 'fallback';
      return true;
    })
    .sort((left, right) => numberMetadata(left, 'sequence') - numberMetadata(right, 'sequence') || Date.parse(left.timestamp) - Date.parse(right.timestamp)),
  [timelineFilter, trace.nodes]);

  const artifacts = useMemo(() => trace.nodes.filter((node) => node.kind === 'AgentProposal'), [trace.nodes]);
  const selectedRelations = useMemo(() => selected ? trace.edges.filter((edge) => edge.source === selected.id || edge.target === selected.id) : [], [selected, trace.edges]);
  const tabs: Array<{ id: ViewMode; label: string; Icon: typeof GitBranch }> = [
    { id: 'timeline', label: 'Paso a paso', Icon: ClockCounterClockwise },
    { id: 'graph', label: 'Mapa de decisiones', Icon: GitBranch },
    { id: 'artifacts', label: 'Artefactos', Icon: Cpu },
  ];

  const selectTab = (next: number) => {
    const normalized = (next + tabs.length) % tabs.length;
    setView(tabs[normalized].id);
    tabRefs.current[normalized]?.focus();
  };

  return <section className="provenance-panel" aria-labelledby="graph-title">
    <div className="graph-heading">
      <div><p>TRAZABILIDAD DEL CASO</p><h3 id="graph-title">Qué ocurrió y por qué</h3><span>Revisa cada paso, la evidencia utilizada y la decisión que todavía requiere una persona.</span></div>
      {availableRuns.length ? <label className="run-selector"><span>Corrida observada</span><select value={selectedRun || ''} onChange={(event) => { setSelectedRun(event.target.value); setSelected(null); }}>
        {availableRuns.map((node) => <option value={String(node.metadata.run_id)} key={node.id}>{node.label} · {statusText(node.status)}</option>)}
      </select></label> : <b>Sin corridas registradas</b>}
    </div>

    <div className="observability-metrics" aria-label="Métricas de la corrida">
      <TraceMetric icon={<Pulse />} label="Pasos registrados" value={String(summary.eventCount)} note={`${summary.agentCount}/4 agentes participaron`} />
      <TraceMetric icon={<ClockCounterClockwise />} label="Duración de coordinación" value={summary.activeDurationMs ? formatDuration(summary.activeDurationMs) : 'En curso'} note={`${formatDuration(summary.elapsedMs)} desde el inicio`} />
      <TraceMetric icon={<Cpu />} label="Asistencia inteligente" value={summary.model} note="Resultado revisable por el equipo" />
      <TraceMetric icon={<LockKey />} label="Decisión profesional" value={statusText(summary.gateStatus)} note={summary.fallbackCount ? `${summary.fallbackCount} alerta(s) registrada(s)` : 'sin acciones ocultas'} />
    </div>

    <div className="execution-tabs" role="tablist" aria-label="Vistas de observabilidad">
      {tabs.map(({ id, label, Icon }, index) => <button
        ref={(element) => { tabRefs.current[index] = element; }}
        id={`trace-tab-${id}`}
        role="tab"
        aria-selected={view === id}
        aria-controls={`trace-panel-${id}`}
        tabIndex={view === id ? 0 : -1}
        className={view === id ? 'tab-active' : ''}
        onClick={() => setView(id)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') { event.preventDefault(); selectTab(index + 1); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); selectTab(index - 1); }
        }}
        key={id}
      ><Icon />{label}<span>{id === 'graph' ? trace.nodes.length : id === 'timeline' ? timeline.length : artifacts.length}</span></button>)}
    </div>

    <div className={`trace-workspace ${selected ? 'trace-workspace-selected' : 'trace-workspace-empty'}`}>
      <div className="trace-view">
        {view === 'graph' ? <div id="trace-panel-graph" role="tabpanel" aria-labelledby="trace-tab-graph" className="decision-map-panel" aria-label="Mapa de decisión de la ruta">
          <p className="decision-map-intro">Este mapa resume la lógica clínica-operativa. Cada bloque se abre para revisar su evidencia; la red técnica completa queda disponible al final.</p>
          <DecisionMap trace={trace.nodes} selected={selected} onSelect={setSelected} />
          <details className="technical-flow"><summary>Ver red técnica completa de eventos</summary><div className="graph-canvas">
            <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.25} maxZoom={1.5} nodesDraggable={false}
              onNodeClick={(_, node) => setSelected(trace.nodes.find((item) => item.id === node.id) || null)}
              onSelectionChange={({ nodes: selectedNodes }) => {
                const node = selectedNodes[selectedNodes.length - 1];
                setSelected(node ? trace.nodes.find((item) => item.id === node.id) || null : null);
              }}>
              <Background color="#c8dcda" gap={22} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div></details>
        </div> : null}

        {view === 'timeline' ? <div id="trace-panel-timeline" role="tabpanel" aria-labelledby="trace-tab-timeline" className="timeline-panel">
          <div className="timeline-filters" aria-label="Filtrar cronología">{([
            ['all', 'Todo'], ['agents', 'Agentes'], ['policy', 'Política'], ['human', 'Autorización'], ['errors', 'Alertas'],
          ] as Array<[TimelineFilter, string]>).map(([id, label]) => <button aria-pressed={timelineFilter === id} onClick={() => setTimelineFilter(id)} key={id}>{label}</button>)}</div>
          <ol className="trace-timeline">{timeline.map((node) => <li key={node.id}><button aria-pressed={selected?.id === node.id} aria-controls="trace-inspector" className={selected?.id === node.id ? 'timeline-selected' : ''} onClick={() => setSelected(node)}><time>{timeText(node.timestamp)}</time><i style={{ background: kindColor[node.kind] || '#719390' }} /><span><small>#{String(node.metadata.sequence || '·').padStart(2, '0')} · {kindLabel[node.kind] || node.kind}</small><strong>{node.actor}</strong><em>{node.explanation}</em></span><b>{statusText(node.status)}</b></button></li>)}</ol>
        </div> : null}

        {view === 'artifacts' ? <div id="trace-panel-artifacts" role="tabpanel" aria-labelledby="trace-tab-artifacts" className="artifact-panel">
          {artifacts.length ? artifacts.map((node) => <ArtifactCard node={node} selected={selected?.id === node.id} onSelect={() => setSelected(node)} key={node.id} />) : <EmptyTrace />}
        </div> : null}
      </div>

      <TraceInspector selected={selected} relations={selectedRelations} onClear={() => setSelected(null)} />
    </div>
  </section>;
}

const decisionSteps = [
  { kinds: ['FamilyReport'], label: '1. Información recibida', empty: 'Aún no se registra un aviso de la familia.' },
  { kinds: ['SynthesisGenerated'], label: '2. Información organizada', empty: 'La síntesis se prepara conservando el texto original.' },
  { kinds: ['SynthesisValidation'], label: '3. Revisión profesional', empty: 'Pendiente de validación profesional.' },
  { kinds: ['OrchestratorGate'], label: '4. Agentes habilitados', empty: 'Los agentes siguen bloqueados hasta validar.' },
  { kinds: ['AgentProposal', 'ApprovalRequest', 'ApprovalDecision', 'Task'], label: '5. Propuesta y continuidad', empty: 'Aquí aparecerá la propuesta o tarea autorizada.' },
];

function DecisionMap({ trace, selected, onSelect }: { trace: ProvenanceNode[]; selected: ProvenanceNode | null; onSelect: (node: ProvenanceNode) => void }) {
  return <ol className="decision-map">{decisionSteps.map((step, index) => {
    const matching = trace.filter((node) => step.kinds.includes(node.kind));
    const node = matching[matching.length - 1];
    return <li className={node ? 'decision-step-ready' : 'decision-step-waiting'} key={step.label}>
      <span className="decision-step-number">{index + 1}</span>
      {node ? <button aria-pressed={selected?.id === node.id} onClick={() => onSelect(node)}>
        <small>{step.label}</small><strong>{decisionMessage(node)}</strong><em>{statusText(node.status)}</em>
      </button> : <div><small>{step.label}</small><strong>{step.empty}</strong><em>En espera</em></div>}
    </li>;
  })}</ol>;
}

function decisionMessage(node: ProvenanceNode) {
  const messages: Record<string, string> = {
    FamilyReport: 'La familia comunicó una dificultad para continuar la ruta.',
    SynthesisGenerated: 'La información se ordenó y conserva su origen.',
    SynthesisValidation: node.metadata.validated_by_professional ? 'Una profesional validó la información.' : 'La revisión profesional dejó observaciones.',
    OrchestratorGate: 'El orquestador puede distribuir trabajo autorizado.',
    AgentProposal: 'Los agentes prepararon una propuesta revisable.',
    ApprovalRequest: 'La propuesta espera una decisión profesional.',
    ApprovalDecision: 'La decisión profesional quedó registrada.',
    Task: 'Se creó un siguiente paso autorizado para la ruta.',
  };
  return messages[node.kind] || node.explanation;
}

function TraceMetric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <article><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></article>;
}

function ArtifactCard({ node, selected, onSelect }: { node: ProvenanceNode; selected: boolean; onSelect: () => void }) {
  const artifact = (node.metadata.artifact || {}) as Record<string, unknown>;
  const evidence = Array.isArray(artifact.evidence) ? artifact.evidence.map(String) : [];
  return <article className={`artifact-card ${selected ? 'artifact-selected' : ''}`}>
    <button className="artifact-card-trigger" aria-pressed={selected} aria-controls="trace-inspector" onClick={onSelect}><span><Cpu /></span><span className="artifact-card-copy"><small>{String(node.metadata.agent_id || node.actor)}</small><strong>{String(artifact.summary || node.explanation)}</strong></span><b>{statusText(String(artifact.confidence || 'registrado'))}</b></button>
    <dl><div><dt>Decisión propuesta</dt><dd>{String(artifact.decision || node.explanation)}</dd></div><div><dt>Evidencia</dt><dd>{evidence.join(' · ') || 'Sin evidencia declarada'}</dd></div><div><dt>Motor efectivo</dt><dd>{String(node.metadata.provider || 'No registrado')} · {String(node.metadata.model || 'No registrado')}</dd></div><div><dt>Duración</dt><dd>{formatDuration(numberMetadata(node, 'duration_ms'))}</dd></div></dl>
  </article>;
}

function TraceInspector({ selected, relations, onClear }: { selected: ProvenanceNode | null; relations: GraphData['edges']; onClear: () => void }) {
  if (!selected) return <aside id="trace-inspector" className="graph-inspector graph-inspector-empty"><GitBranch /><strong>Selecciona un paso</strong><p>Inspecciona un nodo, evento o artefacto para conocer su origen y sus relaciones.</p></aside>;
  const visibleMetadata = Object.entries(selected.metadata).filter(([key]) => !['artifact', 'explanation', 'previous_event_id', 'origin', 'sensitivity'].includes(key));
  return <aside id="trace-inspector" className="graph-inspector" aria-live="polite">
    <div className="inspector-title"><span style={{ background: kindColor[selected.kind] || '#719390' }}><FlowArrow /></span><div><small>{kindLabel[selected.kind] || selected.kind}</small><strong>{selected.actor}</strong></div><button onClick={onClear} aria-label="Cerrar inspección">×</button></div>
    <p>{selected.explanation}</p>
    <dl className="inspector-primary"><div><dt>Estado</dt><dd>{statusText(selected.status)}</dd></div><div><dt>Momento</dt><dd>{new Date(selected.timestamp).toLocaleString('es-PE')}</dd></div><div><dt>Origen</dt><dd>{selected.origin}</dd></div><div><dt>Sensibilidad</dt><dd><ShieldCheck /> {selected.sensitivity}</dd></div></dl>
    <details className="technical-details"><summary>Ver detalle técnico</summary><dl className="inspector-metadata">{visibleMetadata.map(([key, value]) => <div key={key}><dt>{metadataLabel(key)}</dt><dd>{formatMetadata(value)}</dd></div>)}</dl></details>
    <section><h4>Relaciones causales</h4>{relations.length ? <ul>{relations.map((edge) => <li key={edge.id}><b>{edge.source === selected.id ? 'Sale' : 'Entra'}</b><span>{edge.relation}</span><small>{edge.explanation}</small></li>)}</ul> : <p>Este nodo no tiene relaciones adicionales en la vista seleccionada.</p>}</section>
  </aside>;
}

function EmptyTrace() {
  return <div className="trace-empty"><Cpu /><strong>Aún no hay artefactos</strong><span>Los resultados estructurados aparecerán cuando los agentes terminen cada paso.</span></div>;
}

function numberMetadata(node: ProvenanceNode, key: string) {
  const value = node.metadata[key];
  return typeof value === 'number' ? value : Number(value || 0);
}

function statusText(value?: string | null) {
  return ({
    waiting_approval: 'Espera autorización', completed: 'Completada', running: 'Ejecutando', queued: 'En cola',
    paused: 'Pausada', failed: 'Fallo seguro', working: 'Trabajando', approved: 'Aprobada', rejected: 'Rechazada',
    pending: 'Pendiente', not_requested: 'Sin solicitud', high: 'Alta', medium: 'Media', low: 'Baja',
  } as Record<string, string>)[value || ''] || value || 'Registrado';
}

function timeText(value: string) {
  return new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function metadataLabel(value: string) {
  return ({ trace_id: 'ID de traza', run_id: 'ID de corrida', span_id: 'ID de span', sequence: 'Secuencia', event_id: 'ID de evento', event_schema: 'Esquema', agent_id: 'Agente', phase: 'Fase', duration_ms: 'Duración', provider: 'Proveedor', model: 'Modelo', tool: 'Herramienta', started_at: 'Inicio', finished_at: 'Fin', status: 'Estado', run_status: 'Estado de corrida', barrier_report_id: 'Barrera', proposal_hash: 'Hash de propuesta' } as Record<string, string>)[value] || value.replace(/_/g, ' ');
}

function formatMetadata(value: unknown) {
  if (Array.isArray(value)) return value.join(' · ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? 'No registrado');
}
