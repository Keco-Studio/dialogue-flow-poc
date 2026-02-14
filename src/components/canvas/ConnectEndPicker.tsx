'use client';

import { useCallback } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import type { NodeType } from '@/models/types';

const NODE_TYPES: { type: NodeType; label: string; icon: string }[] = [
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

interface ConnectEndPickerProps {
  position: { screenX: number; screenY: number; flowX: number; flowY: number };
  fromPinId: string;
  onClose: () => void;
}

export default function ConnectEndPicker({ position, fromPinId, onClose }: ConnectEndPickerProps) {
  const createNode = useGraphStore((s) => s.createNode);
  const createEdge = useGraphStore((s) => s.createEdge);

  const handleCreate = useCallback(
    (type: NodeType) => {
      const nodeId = createNode(type, { x: position.flowX, y: position.flowY });
      // Re-read pins after createNode (store was updated synchronously)
      const updatedPins = useGraphStore.getState().pins;
      const inputPin = Object.values(updatedPins).find(
        (p) => p.nodeId === nodeId && p.direction === 'in',
      );
      if (inputPin) {
        createEdge(fromPinId, inputPin.id);
      }
      onClose();
    },
    [position, fromPinId, createNode, createEdge, onClose],
  );

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={onClose} />
      <div className="context-menu" style={{ position: 'fixed', left: position.screenX, top: position.screenY }}>
        <div style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
          Connect to new node
        </div>
        {NODE_TYPES.map(({ type, label, icon }) => (
          <button key={type} className="context-menu-item" onClick={() => handleCreate(type)}>
            {icon} {label}
          </button>
        ))}
      </div>
    </>
  );
}
