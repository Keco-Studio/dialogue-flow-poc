import { memo } from 'react';
import { BaseNode } from './BaseNode';

function JumpNodeInner({ data }: { data: Record<string, unknown> }) {
  const targetNodeId = data.targetNodeId as string | undefined;
  return (
    <BaseNode
      label="Jump"
      color="#e67e22"
      icon="↗"
      inputPins={data.inputPins as never}
      outputPins={data.outputPins as never}
    >
      <div className="flow-node-text">{targetNodeId ? `→ ${targetNodeId}` : '(no target)'}</div>
    </BaseNode>
  );
}

export const JumpNode = memo(JumpNodeInner);
