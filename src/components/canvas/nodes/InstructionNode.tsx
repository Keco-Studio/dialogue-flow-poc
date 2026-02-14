import { memo } from 'react';
import { BaseNode } from './BaseNode';

function InstructionNodeInner({ data }: { data: Record<string, unknown> }) {
  const expression = (data.expression as string) || '';
  return (
    <BaseNode
      label="Instruction"
      color="#9b59b6"
      icon="⚡"
      inputPins={data.inputPins as never}
      outputPins={data.outputPins as never}
    >
      <div className="flow-node-text">{expression || '(instruction)'}</div>
    </BaseNode>
  );
}

export const InstructionNode = memo(InstructionNodeInner);
