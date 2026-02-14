'use client';

import { useCallback } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Node } from '@/models/types';

interface NodePropertiesProps {
  node: Node;
}

export default function NodeProperties({ node }: NodePropertiesProps) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const characters = useProjectStore((s) => s.characters);

  const handleChange = useCallback(
    (field: string, value: string) => {
      updateNodeData(node.id, { [field]: value });
    },
    [node.id, updateNodeData],
  );

  return (
    <div className="node-properties">
      <div className="property-group">
        <label className="property-label">Type</label>
        <div className="property-value">{node.type}</div>
      </div>

      <div className="property-group">
        <label className="property-label">Position</label>
        <div className="property-value">
          {Math.round(node.position.x)}, {Math.round(node.position.y)}
        </div>
      </div>

      {node.data.type === 'line' && (
        <>
          <div className="property-group">
            <label className="property-label">Speaker</label>
            <select
              value={node.data.speakerId || ''}
              onChange={(e) => handleChange('speakerId', e.target.value)}
            >
              <option value="">(none)</option>
              {Object.values(characters).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="property-group">
            <label className="property-label">Text</label>
            <textarea
              value={node.data.text}
              onChange={(e) => handleChange('text', e.target.value)}
              rows={4}
            />
          </div>
        </>
      )}

      {node.data.type === 'choice' && (
        <div className="property-group">
          <label className="property-label">Prompt</label>
          <input
            type="text"
            value={node.data.prompt || ''}
            onChange={(e) => handleChange('prompt', e.target.value)}
          />
        </div>
      )}

      {(node.data.type === 'condition' || node.data.type === 'instruction') && (
        <div className="property-group">
          <label className="property-label">Expression</label>
          <input
            type="text"
            value={node.data.expression}
            onChange={(e) => handleChange('expression', e.target.value)}
          />
        </div>
      )}

      {(node.data.type === 'dialogueContainer' || node.data.type === 'flowFragment') && (
        <div className="property-group">
          <label className="property-label">Label</label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>
      )}

      {node.data.type === 'hub' && (
        <div className="property-group">
          <label className="property-label">Label</label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>
      )}

      {node.data.type === 'annotation' && (
        <>
          <div className="property-group">
            <label className="property-label">Text</label>
            <textarea
              value={node.data.text}
              onChange={(e) => handleChange('text', e.target.value)}
              rows={4}
            />
          </div>
          <div className="property-group">
            <label className="property-label">Color</label>
            <input
              type="color"
              value={node.data.color || '#f5e642'}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>
        </>
      )}

      {node.data.type === 'jump' && (
        <div className="property-group">
          <label className="property-label">Target Node</label>
          <input
            type="text"
            value={node.data.targetNodeId || ''}
            onChange={(e) => handleChange('targetNodeId', e.target.value)}
            placeholder="Enter target node ID"
          />
        </div>
      )}
    </div>
  );
}
