import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from '@/stores/graphStore';
import { useProjectStore } from '@/stores/projectStore';
import { exportProject } from '@/services/serializer';
import { importProject } from '@/services/importer';

function resetStores() {
  useGraphStore.setState({
    activeGraphId: '',
    graphs: {},
    nodes: {},
    edges: {},
    pins: {},
  });
  useGraphStore.temporal.getState().clear();
}

describe('serializer round-trip', () => {
  beforeEach(resetStores);

  it('export → import → re-export produces identical JSON', () => {
    // Set up project
    useProjectStore.getState().createProject('Round Trip Test');
    useProjectStore.getState().addCharacter('Alice');
    useProjectStore.getState().addCharacter('Bob');

    const graphId = useGraphStore.getState().createGraph('Main Graph');
    useGraphStore.getState().setActiveGraph(graphId);

    // Create nodes
    const node1 = useGraphStore.getState().createNode('line', { x: 100, y: 200 });
    const node2 = useGraphStore.getState().createNode('choice', { x: 300, y: 200 });
    const node3 = useGraphStore.getState().createNode('end', { x: 500, y: 200 });

    useGraphStore.getState().updateNodeData(node1, { text: 'Hello world' });
    useGraphStore.getState().updateNodeData(node2, { prompt: 'Choose wisely' });

    // Connect nodes
    const state = useGraphStore.getState();
    const n1out = Object.values(state.pins).find(
      (p) => p.nodeId === node1 && p.direction === 'out',
    )!;
    const n2in = Object.values(state.pins).find(
      (p) => p.nodeId === node2 && p.direction === 'in',
    )!;
    const n2outs = Object.values(state.pins).filter(
      (p) => p.nodeId === node2 && p.direction === 'out',
    );
    const n3in = Object.values(state.pins).find(
      (p) => p.nodeId === node3 && p.direction === 'in',
    )!;

    useGraphStore.getState().createEdge(n1out.id, n2in.id);
    useGraphStore.getState().createEdge(n2outs[0].id, n3in.id, 'Yes');

    // Add hierarchy
    useProjectStore.getState().addTreeNode(null, 'folder', 'Chapter 1');

    // Export
    const export1 = exportProject();

    // Reset and import
    resetStores();
    importProject(export1);

    // Re-export
    const export2 = exportProject();

    // Compare - should be identical
    expect(export2).toBe(export1);
  });

  it('import rejects invalid JSON', () => {
    expect(() => importProject('not json')).toThrow();
  });

  it('import rejects missing required fields', () => {
    expect(() => importProject(JSON.stringify({ schemaVersion: 1 }))).toThrow();
  });

  it('import rejects unsupported schema version', () => {
    const futureExport = {
      schemaVersion: 999,
      id: 'test',
      name: 'Test',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      characters: [],
      hierarchyRoot: [],
      graphs: [],
    };
    expect(() => importProject(JSON.stringify(futureExport))).toThrow('Unsupported schema version');
  });
});
