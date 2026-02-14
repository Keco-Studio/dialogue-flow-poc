'use client';

import { useCallback } from 'react';
import type { NodeType } from '@/models/types';

const NODE_TYPE_LIST: { type: NodeType; label: string; icon: string }[] = [
  { type: 'line', label: 'Line', icon: '💬' },
  { type: 'choice', label: 'Choice', icon: '🔀' },
  { type: 'condition', label: 'Condition', icon: '❓' },
  { type: 'instruction', label: 'Instruction', icon: '⚡' },
  { type: 'dialogueContainer', label: 'Dialogue Container', icon: '📦' },
  { type: 'flowFragment', label: 'Flow Fragment', icon: '📦' },
  { type: 'jump', label: 'Jump', icon: '↗' },
  { type: 'hub', label: 'Hub', icon: '◎' },
  { type: 'end', label: 'End', icon: '⏹' },
  { type: 'annotation', label: 'Annotation', icon: '📝' },
];

export default function NodeToolbar() {
  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: NodeType) => {
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  return (
    <div className="node-toolbar">
      {NODE_TYPE_LIST.map(({ type, label, icon }) => (
        <div
          key={type}
          className="node-toolbar-item"
          draggable
          onDragStart={(e) => onDragStart(e, type)}
          title={`Drag to create a ${label} node`}
        >
          <span className="node-toolbar-icon">{icon}</span>
          <span className="node-toolbar-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
