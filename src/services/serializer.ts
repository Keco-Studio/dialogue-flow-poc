import { useGraphStore } from '@/stores/graphStore';
import { useProjectStore } from '@/stores/projectStore';
import { stableStringify } from '@/lib/stableStringify';
import type { Pin } from '@/models/types';

function roundPosition(val: number): number {
  return Math.round(val * 10) / 10;
}

function sortById<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

function serializePin(pin: Pin) {
  const result: Record<string, unknown> = {
    id: pin.id,
    nodeId: pin.nodeId,
    direction: pin.direction,
  };
  if (pin.name !== undefined) result.name = pin.name;
  if (pin.conditionExpr !== undefined) result.conditionExpr = pin.conditionExpr;
  if (pin.instructionExpr !== undefined) result.instructionExpr = pin.instructionExpr;
  return result;
}

export function exportProject(): string {
  const graphState = useGraphStore.getState();
  const projectState = useProjectStore.getState();

  const allPins = graphState.pins;

  const graphs = sortById(Object.values(graphState.graphs)).map((graph) => {
    const graphNodes = graph.nodeIds
      .map((id) => graphState.nodes[id])
      .filter(Boolean);

    const nodes = sortById(graphNodes).map((node) => {
      const nodePins = Object.values(allPins).filter((p) => p.nodeId === node.id);
      const inputPins = sortById(nodePins.filter((p) => p.direction === 'in')).map(serializePin);
      const outputPins = sortById(nodePins.filter((p) => p.direction === 'out')).map(serializePin);

      return {
        id: node.id,
        type: node.type,
        position: {
          x: roundPosition(node.position.x),
          y: roundPosition(node.position.y),
        },
        inputPins,
        outputPins,
        data: node.data,
      };
    });

    const graphEdges = graph.edgeIds
      .map((id) => graphState.edges[id])
      .filter(Boolean);

    const edges = sortById(graphEdges).map((edge) => {
      const result: Record<string, unknown> = {
        id: edge.id,
        fromPinId: edge.fromPinId,
        toPinId: edge.toPinId,
      };
      if (edge.label !== undefined) result.label = edge.label;
      if (edge.color !== undefined) result.color = edge.color;
      return result;
    });

    return { id: graph.id, name: graph.name, nodes, edges };
  });

  const characters = sortById(Object.values(projectState.characters));

  const exportData = {
    schemaVersion: projectState.schemaVersion,
    id: projectState.id,
    name: projectState.name,
    createdAt: projectState.createdAt,
    updatedAt: projectState.updatedAt,
    characters,
    hierarchyRoot: projectState.hierarchyRoot,
    graphs,
  };

  return stableStringify(exportData);
}
