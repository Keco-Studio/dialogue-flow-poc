import { useGraphStore } from '@/stores/graphStore';

export interface ValidationWarning {
  nodeId: string;
  message: string;
  rule: string;
}

export function validateGraph(graphId: string): ValidationWarning[] {
  const state = useGraphStore.getState();
  const graph = state.graphs[graphId];
  if (!graph) return [];

  const warnings: ValidationWarning[] = [];

  for (const nodeId of graph.nodeIds) {
    const node = state.nodes[nodeId];
    if (!node) continue;

    const nodePins = Object.values(state.pins).filter((p) => p.nodeId === nodeId);
    const outputPins = nodePins.filter((p) => p.direction === 'out');

    // Edges from this node's output pins
    const outgoingEdges = Object.values(state.edges).filter((e) =>
      outputPins.some((p) => p.id === e.fromPinId),
    );

    // Choice nodes with < 2 outgoing edges
    if (node.type === 'choice' && outgoingEdges.length < 2) {
      warnings.push({
        nodeId,
        message: `Choice node has ${outgoingEdges.length} outgoing edge(s), needs at least 2`,
        rule: 'choice-min-edges',
      });
    }

    // Choice edges without labels
    if (node.type === 'choice') {
      for (const edge of outgoingEdges) {
        if (!edge.label?.trim()) {
          warnings.push({
            nodeId,
            message: 'Choice edge missing label',
            rule: 'choice-edge-label',
          });
        }
      }
    }

    // End nodes with output edges
    if (node.type === 'end' && outgoingEdges.length > 0) {
      warnings.push({
        nodeId,
        message: 'End node should have no outgoing edges',
        rule: 'end-no-output',
      });
    }

    // Jump nodes without target
    if (node.type === 'jump' && node.data.type === 'jump' && !node.data.targetNodeId) {
      warnings.push({
        nodeId,
        message: 'Jump node has no target',
        rule: 'jump-needs-target',
      });
    }
  }

  // Broken edges (referencing non-existent pins)
  for (const edgeId of graph.edgeIds) {
    const edge = state.edges[edgeId];
    if (!edge) continue;

    if (!state.pins[edge.fromPinId]) {
      warnings.push({
        nodeId: '',
        message: `Edge ${edge.id} references non-existent source pin`,
        rule: 'broken-edge',
      });
    }
    if (!state.pins[edge.toPinId]) {
      warnings.push({
        nodeId: '',
        message: `Edge ${edge.id} references non-existent target pin`,
        rule: 'broken-edge',
      });
    }
  }

  return warnings;
}
