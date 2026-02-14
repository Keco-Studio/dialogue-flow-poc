'use client';

import { useState, useMemo } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { validateGraph } from '@/services/validator';

interface ValidationOverlayProps {
  graphId: string;
}

export default function ValidationOverlay({ graphId }: ValidationOverlayProps) {
  const [showList, setShowList] = useState(false);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const pins = useGraphStore((s) => s.pins);

  const warnings = useMemo(() => {
    return validateGraph(graphId);
    // Re-validate when graph data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphId, nodes, edges, pins]);

  if (warnings.length === 0) return null;

  return (
    <>
      <button className="validation-badge" onClick={() => setShowList(!showList)}>
        ⚠ {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
      </button>
      {showList && (
        <div className="validation-list">
          {warnings.map((w, i) => (
            <div key={i} className="validation-item">
              <span>⚠</span>
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
