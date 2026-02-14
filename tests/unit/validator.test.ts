import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from '@/stores/graphStore';
import { validateGraph } from '@/services/validator';

function resetStore() {
  useGraphStore.setState({
    activeGraphId: '',
    graphs: {},
    nodes: {},
    edges: {},
    pins: {},
  });
  useGraphStore.temporal.getState().clear();
}

describe('validateGraph', () => {
  beforeEach(resetStore);

  it('returns empty array for valid graph', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);

    const nodeA = useGraphStore.getState().createNode('line', { x: 0, y: 0 });
    const nodeB = useGraphStore.getState().createNode('end', { x: 100, y: 0 });

    const state = useGraphStore.getState();
    const outPin = Object.values(state.pins).find(
      (p) => p.nodeId === nodeA && p.direction === 'out',
    )!;
    const inPin = Object.values(state.pins).find(
      (p) => p.nodeId === nodeB && p.direction === 'in',
    )!;

    useGraphStore.getState().createEdge(outPin.id, inPin.id);

    const warnings = validateGraph(graphId);
    expect(warnings).toHaveLength(0);
  });

  it('warns on choice node with < 2 outgoing edges', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    useGraphStore.getState().createNode('choice', { x: 0, y: 0 });

    const warnings = validateGraph(graphId);
    expect(warnings.some((w) => w.rule === 'choice-min-edges')).toBe(true);
  });

  it('warns on end node with output edges', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const endNode = useGraphStore.getState().createNode('end', { x: 0, y: 0 });
    const lineNode = useGraphStore.getState().createNode('line', { x: 100, y: 0 });

    // Manually add an output pin to end node (shouldn't normally have one)
    const pinId = useGraphStore.getState().addPin(endNode, 'out');
    const state = useGraphStore.getState();
    const inPin = Object.values(state.pins).find(
      (p) => p.nodeId === lineNode && p.direction === 'in',
    )!;

    useGraphStore.getState().createEdge(pinId, inPin.id);

    const warnings = validateGraph(graphId);
    expect(warnings.some((w) => w.rule === 'end-no-output')).toBe(true);
  });

  it('warns on jump node without target', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    useGraphStore.getState().createNode('jump', { x: 0, y: 0 });

    const warnings = validateGraph(graphId);
    expect(warnings.some((w) => w.rule === 'jump-needs-target')).toBe(true);
  });

  it('warns on choice edges without labels', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const choiceNode = useGraphStore.getState().createNode('choice', { x: 0, y: 0 });
    const lineA = useGraphStore.getState().createNode('line', { x: 100, y: 0 });
    const lineB = useGraphStore.getState().createNode('line', { x: 200, y: 0 });

    const state = useGraphStore.getState();
    const outPins = Object.values(state.pins).filter(
      (p) => p.nodeId === choiceNode && p.direction === 'out',
    );
    const inA = Object.values(state.pins).find(
      (p) => p.nodeId === lineA && p.direction === 'in',
    )!;
    const inB = Object.values(state.pins).find(
      (p) => p.nodeId === lineB && p.direction === 'in',
    )!;

    useGraphStore.getState().createEdge(outPins[0].id, inA.id); // no label
    useGraphStore.getState().createEdge(outPins[1].id, inB.id); // no label

    const warnings = validateGraph(graphId);
    expect(warnings.filter((w) => w.rule === 'choice-edge-label')).toHaveLength(2);
  });
});
