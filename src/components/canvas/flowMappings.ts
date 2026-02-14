import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react';
import type { Node, Pin, Edge } from '@/models/types';

export function toReactFlowNode(
  node: Node,
  pins: Pin[],
): RFNode {
  const inputPins = pins.filter((p) => p.nodeId === node.id && p.direction === 'in');
  const outputPins = pins.filter((p) => p.nodeId === node.id && p.direction === 'out');

  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      ...node.data,
      inputPins,
      outputPins,
      nodeId: node.id,
    },
  };
}

export function toReactFlowEdge(edge: Edge): RFEdge {
  return {
    id: edge.id,
    source: '', // Will be resolved by sourceHandle/targetHandle
    target: '',
    sourceHandle: edge.fromPinId,
    targetHandle: edge.toPinId,
    type: 'labeled',
    data: {
      label: edge.label,
      color: edge.color,
    },
  };
}

// Resolve source/target node IDs from pin IDs
export function resolveEdgeNodes(
  edge: Edge,
  pins: Record<string, Pin>,
): { source: string; target: string } {
  const fromPin = pins[edge.fromPinId];
  const toPin = pins[edge.toPinId];
  return {
    source: fromPin?.nodeId ?? '',
    target: toPin?.nodeId ?? '',
  };
}
