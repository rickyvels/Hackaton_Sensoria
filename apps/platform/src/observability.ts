import type { ProvenanceGraph, ProvenanceNode } from './api';

export type RunSummary = {
  eventCount: number;
  agentCount: number;
  activeDurationMs: number;
  elapsedMs: number;
  fallbackCount: number;
  gateStatus: string;
  provider: string;
  model: string;
};

const numberValue = (value: unknown) => typeof value === 'number' ? value : Number(value || 0);
const stringValue = (value: unknown, fallback = 'No registrado') => typeof value === 'string' && value ? value : fallback;

export function runNodes(graph: ProvenanceGraph) {
  return graph.nodes
    .filter((node) => node.kind === 'OrchestrationRun')
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

export function selectTraceGraph(graph: ProvenanceGraph, runId: string | null): ProvenanceGraph {
  if (!runId) return graph;
  const runNodeId = `run-${runId}`;
  const allowed = new Set(
    graph.nodes
      .filter((node) => node.id === runNodeId || node.metadata.run_id === runId)
      .map((node) => node.id),
  );
  const incoming = new Map<string, string[]>();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const edge of graph.edges) incoming.set(edge.target, [...(incoming.get(edge.target) || []), edge.source]);
  const pending = [runNodeId];
  while (pending.length) {
    const target = pending.pop()!;
    for (const source of incoming.get(target) || []) {
      const sourceRunId = nodeById.get(source)?.metadata.run_id;
      if (sourceRunId && sourceRunId !== runId) continue;
      if (allowed.has(source)) continue;
      allowed.add(source);
      pending.push(source);
    }
  }
  return {
    nodes: graph.nodes.filter((node) => allowed.has(node.id)),
    edges: graph.edges.filter((edge) => allowed.has(edge.source) && allowed.has(edge.target)),
  };
}

export function buildRunSummary(graph: ProvenanceGraph, runId: string | null): RunSummary {
  const runNode = graph.nodes.find((node) => node.id === `run-${runId}`);
  const metadata = runNode?.metadata || {};
  const traceEvents = graph.nodes.filter((node) => node.metadata.run_id === runId && node.kind !== 'OrchestrationRun');
  const agents = new Set(
    traceEvents
      .filter((node) => node.kind === 'AgentProposal')
      .map((node) => node.metadata.agent_id)
      .filter(Boolean),
  );
  return {
    eventCount: numberValue(metadata.event_count) || traceEvents.length,
    agentCount: numberValue(metadata.agent_count) || agents.size,
    activeDurationMs: numberValue(metadata.active_duration_ms),
    elapsedMs: numberValue(metadata.elapsed_ms),
    fallbackCount: numberValue(metadata.fallback_count),
    gateStatus: stringValue(metadata.gate_status, runNode?.status || 'not_requested'),
    provider: stringValue(metadata.provider),
    model: stringValue(metadata.model),
  };
}

export function layoutCausalGraph(graph: ProvenanceGraph): Record<string, { x: number; y: number }> {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const incomingCount = new Map(graph.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
  }
  const levels = new Map<string, number>();
  const queue = graph.nodes.filter((node) => incomingCount.get(node.id) === 0).map((node) => node.id);
  for (const id of queue) levels.set(id, 0);
  while (queue.length) {
    const source = queue.shift()!;
    for (const target of outgoing.get(source) || []) {
      levels.set(target, Math.max(levels.get(target) || 0, (levels.get(source) || 0) + 1));
      incomingCount.set(target, (incomingCount.get(target) || 1) - 1);
      if (incomingCount.get(target) === 0) queue.push(target);
    }
  }
  const rows = new Map<number, ProvenanceNode[]>();
  for (const node of graph.nodes) {
    const level = levels.get(node.id) ?? 0;
    rows.set(level, [...(rows.get(level) || []), node]);
  }
  const positions: Record<string, { x: number; y: number }> = {};
  for (const [level, nodes] of rows) {
    nodes.sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp));
    nodes.forEach((node, index) => { positions[node.id] = { x: level * 245, y: index * 126 }; });
  }
  return positions;
}

export function formatDuration(durationMs: number) {
  if (durationMs < 1000) return `${durationMs} ms`;
  if (durationMs < 60_000) return `${(durationMs / 1000).toFixed(1)} s`;
  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1000);
  return `${minutes} min ${seconds} s`;
}
