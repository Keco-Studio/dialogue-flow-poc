'use client';

import { useCallback, useState } from 'react';
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

interface CanvasContextMenuProps {
  position: { x: number; y: number; flowX: number; flowY: number } | null;
  onClose: () => void;
}

export default function CanvasContextMenu({ position, onClose }: CanvasContextMenuProps) {
  const createNode = useGraphStore((s) => s.createNode);

  const handleCreate = useCallback(
    (type: NodeType) => {
      if (position) {
        createNode(type, { x: position.flowX, y: position.flowY });
      }
      onClose();
    },
    [position, createNode, onClose],
  );

  if (!position) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={onClose} />
      <div className="context-menu" style={{ position: 'fixed', left: position.x, top: position.y }}>
        {NODE_TYPES.map(({ type, label, icon }) => (
          <button key={type} className="context-menu-item" onClick={() => handleCreate(type)}>
            {icon} {label}
          </button>
        ))}
      </div>
    </>
  );
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    const rfPane = (event.target as HTMLElement).closest('.react-flow__pane');
    if (!rfPane) return;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      flowX: 0,
      flowY: 0,
    });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  return { contextMenu, onPaneContextMenu, closeContextMenu, setContextMenu };
}
