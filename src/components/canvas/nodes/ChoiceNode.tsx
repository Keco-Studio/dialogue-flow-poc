import { memo, useCallback } from 'react';
import { BaseNode } from './BaseNode';
import { useGraphStore } from '@/stores/graphStore';
import type { Pin } from '@/models/types';

function ChoiceNodeInner({ data }: { data: Record<string, unknown> }) {
  const prompt = (data.prompt as string) || '';
  const nodeId = data.nodeId as string;
  const outputPins = (data.outputPins as Pin[]) || [];
  const addPin = useGraphStore((s) => s.addPin);
  const removePin = useGraphStore((s) => s.removePin);

  const handleAddPin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addPin(nodeId, 'out', `Option ${outputPins.length + 1}`);
    },
    [nodeId, outputPins.length, addPin],
  );

  const handleRemovePin = useCallback(
    (e: React.MouseEvent, pinId: string) => {
      e.stopPropagation();
      if (outputPins.length > 2) {
        removePin(pinId);
      }
    },
    [outputPins.length, removePin],
  );

  return (
    <BaseNode
      label="Choice"
      color="#f5a623"
      icon="🔀"
      inputPins={data.inputPins as never}
      outputPins={outputPins}
    >
      <div className="flow-node-text">{prompt || '(choose)'}</div>
      <div className="pin-controls">
        {outputPins.map((pin) => (
          <span key={pin.id} className="pin-badge">
            {pin.name || 'out'}
            {outputPins.length > 2 && (
              <button className="pin-remove-btn" onClick={(e) => handleRemovePin(e, pin.id)}>
                x
              </button>
            )}
          </span>
        ))}
        <button className="pin-add-btn" onClick={handleAddPin}>
          +
        </button>
      </div>
    </BaseNode>
  );
}

export const ChoiceNode = memo(ChoiceNodeInner);
