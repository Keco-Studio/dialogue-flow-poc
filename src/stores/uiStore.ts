'use client';

import { create } from 'zustand';

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface UIStoreState {
  viewport: Viewport;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  navigationStack: string[];
  activePanel: 'properties' | 'none';
  graphViewports: Record<string, Viewport>;
}

interface UIStoreActions {
  setViewport: (viewport: Viewport) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  pushNavigation: (graphId: string) => void;
  popNavigation: () => string | undefined;
  saveGraphViewport: (graphId: string, viewport: Viewport) => void;
  restoreGraphViewport: (graphId: string) => Viewport | undefined;
}

type UIStore = UIStoreState & UIStoreActions;

export const useUIStore = create<UIStore>()((set, get) => ({
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: [],
  selectedEdgeIds: [],
  navigationStack: [],
  activePanel: 'properties',
  graphViewports: {},

  setViewport: (viewport) => set({ viewport }),

  setSelection: (nodeIds, edgeIds) =>
    set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds }),

  pushNavigation: (graphId) =>
    set((state) => ({
      navigationStack: [...state.navigationStack, graphId],
    })),

  popNavigation: () => {
    const state = get();
    if (state.navigationStack.length === 0) return undefined;
    const stack = [...state.navigationStack];
    const popped = stack.pop()!;
    set({ navigationStack: stack });
    return popped;
  },

  saveGraphViewport: (graphId, viewport) =>
    set((state) => ({
      graphViewports: { ...state.graphViewports, [graphId]: viewport },
    })),

  restoreGraphViewport: (graphId) => {
    return get().graphViewports[graphId];
  },
}));
