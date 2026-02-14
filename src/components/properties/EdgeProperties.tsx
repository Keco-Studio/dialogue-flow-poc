'use client';

import { useCallback } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import type { Edge } from '@/models/types';

interface EdgePropertiesProps {
  edge: Edge;
}

export default function EdgeProperties({ edge }: EdgePropertiesProps) {
  const updateEdge = useGraphStore((s) => s.updateEdge);

  const handleChange = useCallback(
    (field: 'label' | 'color', value: string) => {
      updateEdge(edge.id, { [field]: value });
    },
    [edge.id, updateEdge],
  );

  return (
    <div className="edge-properties">
      <div className="property-group">
        <label className="property-label">Label</label>
        <input
          type="text"
          value={edge.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
        />
      </div>
      <div className="property-group">
        <label className="property-label">Color</label>
        <input
          type="color"
          value={edge.color || '#6c6c80'}
          onChange={(e) => handleChange('color', e.target.value)}
        />
      </div>
    </div>
  );
}
