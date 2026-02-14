'use client';

import { useCallback } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { useUIStore } from '@/stores/uiStore';

export default function Breadcrumb() {
  const navigationStack = useUIStore((s) => s.navigationStack);
  const activeGraphId = useGraphStore((s) => s.activeGraphId);
  const graphs = useGraphStore((s) => s.graphs);
  const setActiveGraph = useGraphStore((s) => s.setActiveGraph);
  const popNavigation = useUIStore((s) => s.popNavigation);
  const saveGraphViewport = useUIStore((s) => s.saveGraphViewport);
  const restoreGraphViewport = useUIStore((s) => s.restoreGraphViewport);
  const setViewport = useUIStore((s) => s.setViewport);
  const viewport = useUIStore((s) => s.viewport);

  const handleNavigateTo = useCallback(
    (index: number) => {
      // Navigate to a specific level in the breadcrumb
      const popsNeeded = navigationStack.length - index;
      if (popsNeeded <= 0) return;

      // Save current viewport
      saveGraphViewport(activeGraphId, viewport);

      // Pop back to the target level
      let targetGraphId = activeGraphId;
      for (let i = 0; i < popsNeeded; i++) {
        targetGraphId = popNavigation() || targetGraphId;
      }

      setActiveGraph(targetGraphId);
      const savedViewport = restoreGraphViewport(targetGraphId);
      if (savedViewport) setViewport(savedViewport);
    },
    [navigationStack, activeGraphId, viewport, saveGraphViewport, popNavigation, setActiveGraph, restoreGraphViewport, setViewport],
  );

  if (navigationStack.length === 0) return null;

  return (
    <div className="breadcrumb">
      {navigationStack.map((graphId, i) => (
        <span key={graphId}>
          <button className="breadcrumb-item" onClick={() => handleNavigateTo(i)}>
            {graphs[graphId]?.name || 'Graph'}
          </button>
          <span className="breadcrumb-separator">/</span>
        </span>
      ))}
      <span className="breadcrumb-current">{graphs[activeGraphId]?.name || 'Graph'}</span>
    </div>
  );
}
