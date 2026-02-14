import { memo } from 'react';
import { BaseNode } from './BaseNode';

function ContainerNodeInner({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || '';
  const isDialogue = data.type === 'dialogueContainer';
  return (
    <BaseNode
      label={isDialogue ? 'Dialogue Container' : 'Flow Fragment'}
      color={isDialogue ? '#2ecc71' : '#1abc9c'}
      icon="📦"
      inputPins={data.inputPins as never}
      outputPins={data.outputPins as never}
    >
      <div className="flow-node-text">{label || '(container)'}</div>
    </BaseNode>
  );
}

export const ContainerNode = memo(ContainerNodeInner);
