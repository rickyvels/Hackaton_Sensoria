import { describe, expect, it } from 'vitest';
import type { ProvenanceGraph } from './api';
import { buildRunSummary, layoutCausalGraph, selectTraceGraph } from './observability';

const graph: ProvenanceGraph = {
  nodes: [
    { id: 'case-1', kind: 'Case', label: 'CASO-1', actor: 'Sistema', timestamp: '2026-01-01T10:00:00Z', origin: 'api', sensitivity: 'synthetic', explanation: 'Caso', metadata: {} },
    { id: 'event-1', kind: 'Barrier', label: 'Barrier', actor: 'Orquestador', timestamp: '2026-01-01T10:00:01Z', origin: 'api', sensitivity: 'synthetic', explanation: 'Barrera', metadata: { barrier_report_id: 7, sequence: 1 } },
    { id: 'event-old', kind: 'AggregateMetric', label: 'AggregateMetric', actor: 'Calidad', timestamp: '2026-01-01T09:59:59Z', origin: 'api', sensitivity: 'synthetic', explanation: 'Corrida anterior', metadata: { run_id: 'run-b', trace_id: 'run-b' } },
    { id: 'run-run-a', kind: 'OrchestrationRun', label: 'Corrida run-a', actor: 'Orquestador', timestamp: '2026-01-01T10:00:02Z', origin: 'api', sensitivity: 'synthetic', explanation: 'Corrida', status: 'waiting_approval', metadata: { run_id: 'run-a', trace_id: 'run-a', provider: 'ollama', model: 'qwen3:8b', event_count: 3, agent_count: 1, active_duration_ms: 1250, elapsed_ms: 2500, fallback_count: 0, gate_status: 'waiting_approval' } },
    { id: 'event-2', kind: 'AgentExecution', label: 'AgentExecution', actor: 'navigator', timestamp: '2026-01-01T10:00:03Z', origin: 'api', sensitivity: 'synthetic', explanation: 'Inicio', status: 'working', metadata: { run_id: 'run-a', trace_id: 'run-a', sequence: 1, span_id: 'span-a', phase: 'started' } },
    { id: 'event-3', kind: 'AgentExecution', label: 'AgentExecution', actor: 'navigator', timestamp: '2026-01-01T10:00:04Z', origin: 'api', sensitivity: 'synthetic', explanation: 'Fin', status: 'completed', metadata: { run_id: 'run-a', trace_id: 'run-a', sequence: 2, span_id: 'span-a', phase: 'completed', duration_ms: 1250 } },
    { id: 'run-run-b', kind: 'OrchestrationRun', label: 'Corrida run-b', actor: 'Orquestador', timestamp: '2026-01-02T10:00:00Z', origin: 'api', sensitivity: 'synthetic', explanation: 'Otra corrida', status: 'completed', metadata: { run_id: 'run-b' } },
  ],
  edges: [
    { id: 'old', source: 'event-old', target: 'event-1', relation: 'previous', explanation: 'Historia global entre corridas' },
    { id: 'a', source: 'case-1', target: 'event-1', relation: 'reported', explanation: 'Caso a barrera' },
    { id: 'b', source: 'event-1', target: 'run-run-a', relation: 'triggered_run', explanation: 'Barrera a corrida' },
    { id: 'c', source: 'run-run-a', target: 'event-2', relation: 'executed_by', explanation: 'Corrida a agente' },
    { id: 'd', source: 'event-2', target: 'event-3', relation: 'completed', explanation: 'Inicio a fin' },
  ],
};

describe('observability projection', () => {
  it('keeps the selected run, its events, and causal ancestors', () => {
    const selected = selectTraceGraph(graph, 'run-a');
    expect(selected.nodes.map((node) => node.id)).toEqual(['case-1', 'event-1', 'run-run-a', 'event-2', 'event-3']);
    expect(selected.nodes.some((node) => node.id === 'run-run-b')).toBe(false);
    expect(selected.nodes.some((node) => node.id === 'event-old')).toBe(false);
  });

  it('builds human-readable run metrics from persisted telemetry', () => {
    expect(buildRunSummary(graph, 'run-a')).toMatchObject({
      eventCount: 3,
      agentCount: 1,
      activeDurationMs: 1250,
      elapsedMs: 2500,
      fallbackCount: 0,
      gateStatus: 'waiting_approval',
      provider: 'ollama',
      model: 'qwen3:8b',
    });
  });

  it('places causal successors in later columns', () => {
    const positions = layoutCausalGraph(selectTraceGraph(graph, 'run-a'));
    expect(positions['event-2'].x).toBeGreaterThan(positions['run-run-a'].x);
    expect(positions['event-3'].x).toBeGreaterThan(positions['event-2'].x);
  });
});
