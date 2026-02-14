'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Edge, Graph, Node, NodeData, NodeType, Pin, Position } from '@/models/types';
import { DEFAULT_PINS } from '@/models/defaults';
import { generateId } from '@/lib/ids';

interface GraphStoreState {
  activeGraphId: string;
  graphs: Record<string, Graph>;
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  pins: Record<string, Pin>;
}

interface GraphStoreActions {
  createGraph: (name?: string) => string;
  setActiveGraph: (graphId: string) => void;

  createNode: (type: NodeType, position: Position, graphId?: string) => string;
  deleteNodes: (nodeIds: string[]) => void;
  moveNode: (nodeId: string, position: Position) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;

  addPin: (nodeId: string, direction: 'in' | 'out', name?: string) => string;
  removePin: (pinId: string) => void;
  updatePin: (pinId: string, updates: Partial<Pick<Pin, 'name' | 'conditionExpr' | 'instructionExpr'>>) => void;

  createEdge: (fromPinId: string, toPinId: string, label?: string, color?: string) => string;
  deleteEdges: (edgeIds: string[]) => void;
  updateEdge: (edgeId: string, updates: Partial<Pick<Edge, 'label' | 'color'>>) => void;

  // Bulk hydration for import
  hydrate: (state: Pick<GraphStoreState, 'activeGraphId' | 'graphs' | 'nodes' | 'edges' | 'pins'>) => void;
}

type GraphStore = GraphStoreState & GraphStoreActions;

function getDefaultNodeData(type: NodeType): NodeData {
  switch (type) {
    case 'dialogueContainer':
      return { type: 'dialogueContainer', innerGraphId: '', label: '' };
    case 'flowFragment':
      return { type: 'flowFragment', innerGraphId: '', label: '' };
    case 'line':
      return { type: 'line', text: '' };
    case 'choice':
      return { type: 'choice', prompt: '' };
    case 'condition':
      return { type: 'condition', expression: '' };
    case 'instruction':
      return { type: 'instruction', expression: '' };
    case 'jump':
      return { type: 'jump' };
    case 'hub':
      return { type: 'hub', label: '' };
    case 'end':
      return { type: 'end' };
    case 'annotation':
      return { type: 'annotation', text: '', color: '#f5e642' };
  }
}

export const useGraphStore = create<GraphStore>()(
  temporal(
    (set, get) => ({
      activeGraphId: '',
      graphs: {},
      nodes: {},
      edges: {},
      pins: {},

      createGraph: (name = 'Untitled Graph') => {
        const id = generateId();
        set((state) => ({
          graphs: {
            ...state.graphs,
            [id]: { id, name, nodeIds: [], edgeIds: [] },
          },
        }));
        return id;
      },

      setActiveGraph: (graphId: string) => {
        set({ activeGraphId: graphId });
      },

      createNode: (type, position, graphId?) => {
        const state = get();
        const targetGraphId = graphId ?? state.activeGraphId;
        const nodeId = generateId();
        const config = DEFAULT_PINS[type];
        const data = getDefaultNodeData(type);

        const newPins: Record<string, Pin> = {};
        const inputPinIds: string[] = [];
        const outputPinIds: string[] = [];

        for (let i = 0; i < config.inputCount; i++) {
          const pinId = generateId();
          newPins[pinId] = { id: pinId, nodeId, direction: 'in' };
          inputPinIds.push(pinId);
        }

        for (let i = 0; i < config.outputCount; i++) {
          const pinId = generateId();
          newPins[pinId] = {
            id: pinId,
            nodeId,
            direction: 'out',
            name: config.outputNames?.[i],
          };
          outputPinIds.push(pinId);
        }

        // Auto-create inner graph for container types
        const newGraphs: Record<string, Graph> = {};
        if (type === 'dialogueContainer' || type === 'flowFragment') {
          const innerGraphId = generateId();
          newGraphs[innerGraphId] = { id: innerGraphId, name: `${type === 'dialogueContainer' ? 'Dialogue' : 'Fragment'} Inner`, nodeIds: [], edgeIds: [] };
          (data as { innerGraphId: string }).innerGraphId = innerGraphId;
        }

        const node: Node = { id: nodeId, type, position, data, graphId: targetGraphId };
        const graph = state.graphs[targetGraphId];

        set((s) => ({
          nodes: { ...s.nodes, [nodeId]: node },
          pins: { ...s.pins, ...newPins },
          graphs: {
            ...s.graphs,
            ...newGraphs,
            [targetGraphId]: {
              ...graph,
              nodeIds: [...graph.nodeIds, nodeId],
            },
          },
        }));

        return nodeId;
      },

      deleteNodes: (nodeIds) => {
        set((state) => {
          const newNodes = { ...state.nodes };
          const newPins = { ...state.pins };
          const newEdges = { ...state.edges };
          const newGraphs = { ...state.graphs };

          const pinIdsToRemove = new Set<string>();
          const edgeIdsToRemove = new Set<string>();

          // Collect all pins belonging to the nodes
          for (const nodeId of nodeIds) {
            for (const pin of Object.values(newPins)) {
              if (pin.nodeId === nodeId) {
                pinIdsToRemove.add(pin.id);
              }
            }
          }

          // Collect all edges connected to those pins
          for (const edge of Object.values(newEdges)) {
            if (pinIdsToRemove.has(edge.fromPinId) || pinIdsToRemove.has(edge.toPinId)) {
              edgeIdsToRemove.add(edge.id);
            }
          }

          // Handle container nodes - cascade delete inner graph contents
          for (const nodeId of nodeIds) {
            const node = newNodes[nodeId];
            if (!node) continue;
            if (node.data.type === 'dialogueContainer' || node.data.type === 'flowFragment') {
              const innerGraphId = node.data.innerGraphId;
              if (innerGraphId && newGraphs[innerGraphId]) {
                const innerGraph = newGraphs[innerGraphId];
                // Recursively collect inner nodes for deletion
                for (const innerNodeId of innerGraph.nodeIds) {
                  const innerNode = newNodes[innerNodeId];
                  if (innerNode) {
                    // Collect inner pins
                    for (const pin of Object.values(newPins)) {
                      if (pin.nodeId === innerNodeId) {
                        pinIdsToRemove.add(pin.id);
                      }
                    }
                    delete newNodes[innerNodeId];
                  }
                }
                // Collect inner edges
                for (const innerEdgeId of innerGraph.edgeIds) {
                  delete newEdges[innerEdgeId];
                }
                delete newGraphs[innerGraphId];
              }
            }
          }

          // Remove collected items
          for (const nodeId of nodeIds) {
            const node = newNodes[nodeId];
            if (node) {
              const graph = newGraphs[node.graphId];
              if (graph) {
                newGraphs[node.graphId] = {
                  ...graph,
                  nodeIds: graph.nodeIds.filter((id) => id !== nodeId),
                  edgeIds: graph.edgeIds.filter((id) => !edgeIdsToRemove.has(id)),
                };
              }
              delete newNodes[nodeId];
            }
          }
          for (const pinId of pinIdsToRemove) delete newPins[pinId];
          for (const edgeId of edgeIdsToRemove) delete newEdges[edgeId];

          return { nodes: newNodes, pins: newPins, edges: newEdges, graphs: newGraphs };
        });
      },

      moveNode: (nodeId, position) => {
        set((state) => ({
          nodes: {
            ...state.nodes,
            [nodeId]: { ...state.nodes[nodeId], position },
          },
        }));
      },

      updateNodeData: (nodeId, data) => {
        set((state) => {
          const node = state.nodes[nodeId];
          if (!node) return state;
          return {
            nodes: {
              ...state.nodes,
              [nodeId]: { ...node, data: { ...node.data, ...data } as NodeData },
            },
          };
        });
      },

      addPin: (nodeId, direction, name?) => {
        const pinId = generateId();
        set((state) => ({
          pins: {
            ...state.pins,
            [pinId]: { id: pinId, nodeId, direction, name },
          },
        }));
        return pinId;
      },

      removePin: (pinId) => {
        set((state) => {
          const newPins = { ...state.pins };
          const newEdges = { ...state.edges };
          const newGraphs = { ...state.graphs };

          // Remove edges connected to this pin
          const edgeIdsToRemove: string[] = [];
          for (const edge of Object.values(newEdges)) {
            if (edge.fromPinId === pinId || edge.toPinId === pinId) {
              edgeIdsToRemove.push(edge.id);
            }
          }

          for (const edgeId of edgeIdsToRemove) {
            delete newEdges[edgeId];
          }

          // Update graph edge lists
          if (edgeIdsToRemove.length > 0) {
            const removedSet = new Set(edgeIdsToRemove);
            for (const [gId, graph] of Object.entries(newGraphs)) {
              const filtered = graph.edgeIds.filter((id) => !removedSet.has(id));
              if (filtered.length !== graph.edgeIds.length) {
                newGraphs[gId] = { ...graph, edgeIds: filtered };
              }
            }
          }

          delete newPins[pinId];

          return { pins: newPins, edges: newEdges, graphs: newGraphs };
        });
      },

      updatePin: (pinId, updates) => {
        set((state) => ({
          pins: {
            ...state.pins,
            [pinId]: { ...state.pins[pinId], ...updates },
          },
        }));
      },

      createEdge: (fromPinId, toPinId, label?, color?) => {
        const id = generateId();
        const state = get();
        const fromPin = state.pins[fromPinId];
        if (!fromPin) return id;

        const fromNode = state.nodes[fromPin.nodeId];
        if (!fromNode) return id;

        const edge: Edge = { id, fromPinId, toPinId, label, color };

        set((s) => ({
          edges: { ...s.edges, [id]: edge },
          graphs: {
            ...s.graphs,
            [fromNode.graphId]: {
              ...s.graphs[fromNode.graphId],
              edgeIds: [...s.graphs[fromNode.graphId].edgeIds, id],
            },
          },
        }));

        return id;
      },

      deleteEdges: (edgeIds) => {
        set((state) => {
          const newEdges = { ...state.edges };
          const newGraphs = { ...state.graphs };
          const removedSet = new Set(edgeIds);

          for (const edgeId of edgeIds) delete newEdges[edgeId];

          for (const [gId, graph] of Object.entries(newGraphs)) {
            const filtered = graph.edgeIds.filter((id) => !removedSet.has(id));
            if (filtered.length !== graph.edgeIds.length) {
              newGraphs[gId] = { ...graph, edgeIds: filtered };
            }
          }

          return { edges: newEdges, graphs: newGraphs };
        });
      },

      updateEdge: (edgeId, updates) => {
        set((state) => ({
          edges: {
            ...state.edges,
            [edgeId]: { ...state.edges[edgeId], ...updates },
          },
        }));
      },

      hydrate: (newState) => {
        set(newState);
      },
    }),
    {
      partialize: (state) => ({
        graphs: state.graphs,
        nodes: state.nodes,
        edges: state.edges,
        pins: state.pins,
      }),
      limit: 100,
    },
  ),
);

// Expose pause/resume for drag filtering
export const pauseHistory = () => useGraphStore.temporal.getState().pause();
export const resumeHistory = () => useGraphStore.temporal.getState().resume();
