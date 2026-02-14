import { ProjectExportSchema } from '@/models/schemas';
import { migrateToLatest } from '@/services/migrations';
import { useGraphStore } from '@/stores/graphStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Edge, Graph, Node, Pin } from '@/models/types';

export function importProject(json: string): void {
  const raw = JSON.parse(json) as Record<string, unknown>;
  const migrated = migrateToLatest(raw);
  const validated = ProjectExportSchema.parse(migrated);

  // Normalize into store shapes
  const graphs: Record<string, Graph> = {};
  const nodes: Record<string, Node> = {};
  const edges: Record<string, Edge> = {};
  const pins: Record<string, Pin> = {};
  let firstGraphId = '';

  for (const g of validated.graphs) {
    if (!firstGraphId) firstGraphId = g.id;

    const nodeIds: string[] = [];
    const edgeIds: string[] = [];

    for (const n of g.nodes) {
      nodeIds.push(n.id);
      nodes[n.id] = {
        id: n.id,
        type: n.type,
        position: n.position,
        data: { type: n.type, ...n.data } as Node['data'],
        graphId: g.id,
      };

      for (const p of n.inputPins) {
        pins[p.id] = {
          id: p.id,
          nodeId: p.nodeId,
          direction: p.direction,
          name: p.name,
          conditionExpr: p.conditionExpr,
          instructionExpr: p.instructionExpr,
        };
      }
      for (const p of n.outputPins) {
        pins[p.id] = {
          id: p.id,
          nodeId: p.nodeId,
          direction: p.direction,
          name: p.name,
          conditionExpr: p.conditionExpr,
          instructionExpr: p.instructionExpr,
        };
      }
    }

    for (const e of g.edges) {
      edgeIds.push(e.id);
      edges[e.id] = {
        id: e.id,
        fromPinId: e.fromPinId,
        toPinId: e.toPinId,
        label: e.label,
        color: e.color,
      };
    }

    graphs[g.id] = { id: g.id, name: g.name, nodeIds, edgeIds };
  }

  // Hydrate stores
  useGraphStore.getState().hydrate({
    activeGraphId: firstGraphId,
    graphs,
    nodes,
    edges,
    pins,
  });

  const characters: Record<string, { id: string; name: string }> = {};
  for (const c of validated.characters) {
    characters[c.id] = c;
  }

  useProjectStore.getState().hydrate({
    id: validated.id,
    name: validated.name,
    schemaVersion: validated.schemaVersion,
    createdAt: validated.createdAt,
    updatedAt: validated.updatedAt,
    characters,
    hierarchyRoot: validated.hierarchyRoot as import('@/models/types').TreeNode[],
  });
}
