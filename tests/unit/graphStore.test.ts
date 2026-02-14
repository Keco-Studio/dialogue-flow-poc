import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore, pauseHistory, resumeHistory } from '@/stores/graphStore';

function resetStore() {
  useGraphStore.setState({
    activeGraphId: '',
    graphs: {},
    nodes: {},
    edges: {},
    pins: {},
  });
  // Clear temporal history
  useGraphStore.temporal.getState().clear();
}

describe('graphStore', () => {
  beforeEach(resetStore);

  it('creates a graph', () => {
    const id = useGraphStore.getState().createGraph('Test');
    expect(useGraphStore.getState().graphs[id].name).toBe('Test');
  });

  it('creates a node with default pins', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeId = useGraphStore.getState().createNode('line', { x: 100, y: 200 });

    const state = useGraphStore.getState();
    expect(state.nodes[nodeId]).toBeDefined();
    expect(state.nodes[nodeId].type).toBe('line');
    expect(state.nodes[nodeId].position).toEqual({ x: 100, y: 200 });

    // Line has 1 input, 1 output
    const nodePins = Object.values(state.pins).filter((p) => p.nodeId === nodeId);
    expect(nodePins.filter((p) => p.direction === 'in')).toHaveLength(1);
    expect(nodePins.filter((p) => p.direction === 'out')).toHaveLength(1);
  });

  it('creates a choice node with 2 output pins', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeId = useGraphStore.getState().createNode('choice', { x: 0, y: 0 });

    const state = useGraphStore.getState();
    const outPins = Object.values(state.pins).filter(
      (p) => p.nodeId === nodeId && p.direction === 'out',
    );
    expect(outPins).toHaveLength(2);
    expect(outPins[0].name).toBe('Option 1');
    expect(outPins[1].name).toBe('Option 2');
  });

  it('deletes a node and cascades to pins and edges', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeA = useGraphStore.getState().createNode('line', { x: 0, y: 0 });
    const nodeB = useGraphStore.getState().createNode('line', { x: 100, y: 0 });

    const state1 = useGraphStore.getState();
    const outPin = Object.values(state1.pins).find(
      (p) => p.nodeId === nodeA && p.direction === 'out',
    )!;
    const inPin = Object.values(state1.pins).find(
      (p) => p.nodeId === nodeB && p.direction === 'in',
    )!;

    const edgeId = useGraphStore.getState().createEdge(outPin.id, inPin.id);
    expect(useGraphStore.getState().edges[edgeId]).toBeDefined();

    useGraphStore.getState().deleteNodes([nodeA]);

    const state2 = useGraphStore.getState();
    expect(state2.nodes[nodeA]).toBeUndefined();
    expect(state2.edges[edgeId]).toBeUndefined();
    expect(Object.values(state2.pins).filter((p) => p.nodeId === nodeA)).toHaveLength(0);
  });

  it('removes a pin and cascades to edges', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeA = useGraphStore.getState().createNode('choice', { x: 0, y: 0 });
    const nodeB = useGraphStore.getState().createNode('line', { x: 100, y: 0 });

    const state1 = useGraphStore.getState();
    const outPins = Object.values(state1.pins).filter(
      (p) => p.nodeId === nodeA && p.direction === 'out',
    );
    const inPin = Object.values(state1.pins).find(
      (p) => p.nodeId === nodeB && p.direction === 'in',
    )!;

    const edgeId = useGraphStore.getState().createEdge(outPins[0].id, inPin.id);
    useGraphStore.getState().removePin(outPins[0].id);

    const state2 = useGraphStore.getState();
    expect(state2.pins[outPins[0].id]).toBeUndefined();
    expect(state2.edges[edgeId]).toBeUndefined();
  });

  it('undo restores deleted node', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeId = useGraphStore.getState().createNode('line', { x: 50, y: 50 });

    expect(useGraphStore.getState().nodes[nodeId]).toBeDefined();

    useGraphStore.getState().deleteNodes([nodeId]);
    expect(useGraphStore.getState().nodes[nodeId]).toBeUndefined();

    useGraphStore.temporal.getState().undo();
    expect(useGraphStore.getState().nodes[nodeId]).toBeDefined();
  });

  it('undo restores previous position after move', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeId = useGraphStore.getState().createNode('line', { x: 10, y: 20 });

    useGraphStore.getState().moveNode(nodeId, { x: 100, y: 200 });
    expect(useGraphStore.getState().nodes[nodeId].position).toEqual({ x: 100, y: 200 });

    useGraphStore.temporal.getState().undo();
    expect(useGraphStore.getState().nodes[nodeId].position).toEqual({ x: 10, y: 20 });
  });

  it('redo re-applies after undo', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeId = useGraphStore.getState().createNode('line', { x: 0, y: 0 });

    useGraphStore.getState().moveNode(nodeId, { x: 50, y: 50 });
    useGraphStore.temporal.getState().undo();
    useGraphStore.temporal.getState().redo();
    expect(useGraphStore.getState().nodes[nodeId].position).toEqual({ x: 50, y: 50 });
  });

  it('pause and resume prevents intermediate history entries', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeId = useGraphStore.getState().createNode('line', { x: 0, y: 0 });

    const historyBefore = useGraphStore.temporal.getState().pastStates.length;

    pauseHistory();
    useGraphStore.getState().moveNode(nodeId, { x: 10, y: 10 });
    useGraphStore.getState().moveNode(nodeId, { x: 20, y: 20 });
    useGraphStore.getState().moveNode(nodeId, { x: 30, y: 30 });
    resumeHistory();

    const historyAfter = useGraphStore.temporal.getState().pastStates.length;

    // No new history entries should have been added during pause
    expect(historyAfter).toBe(historyBefore);
    expect(useGraphStore.getState().nodes[nodeId].position).toEqual({ x: 30, y: 30 });
  });

  it('creates and deletes edges', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeA = useGraphStore.getState().createNode('line', { x: 0, y: 0 });
    const nodeB = useGraphStore.getState().createNode('line', { x: 100, y: 0 });

    const state = useGraphStore.getState();
    const outPin = Object.values(state.pins).find(
      (p) => p.nodeId === nodeA && p.direction === 'out',
    )!;
    const inPin = Object.values(state.pins).find(
      (p) => p.nodeId === nodeB && p.direction === 'in',
    )!;

    const edgeId = useGraphStore.getState().createEdge(outPin.id, inPin.id, 'test label');
    expect(useGraphStore.getState().edges[edgeId].label).toBe('test label');

    useGraphStore.getState().deleteEdges([edgeId]);
    expect(useGraphStore.getState().edges[edgeId]).toBeUndefined();
  });

  it('updates edge properties', () => {
    const graphId = useGraphStore.getState().createGraph('Test');
    useGraphStore.getState().setActiveGraph(graphId);
    const nodeA = useGraphStore.getState().createNode('line', { x: 0, y: 0 });
    const nodeB = useGraphStore.getState().createNode('line', { x: 100, y: 0 });

    const state = useGraphStore.getState();
    const outPin = Object.values(state.pins).find(
      (p) => p.nodeId === nodeA && p.direction === 'out',
    )!;
    const inPin = Object.values(state.pins).find(
      (p) => p.nodeId === nodeB && p.direction === 'in',
    )!;

    const edgeId = useGraphStore.getState().createEdge(outPin.id, inPin.id);
    useGraphStore.getState().updateEdge(edgeId, { label: 'updated', color: '#ff0000' });

    const edge = useGraphStore.getState().edges[edgeId];
    expect(edge.label).toBe('updated');
    expect(edge.color).toBe('#ff0000');
  });
});
