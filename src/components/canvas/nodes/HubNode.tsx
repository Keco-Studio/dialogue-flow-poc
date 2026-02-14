import { memo } from 'react';
import { BaseNode } from './BaseNode';

function HubNodeInner({ data }: { data: Record<string, unknown> }) {
  const label = (data.label as string) || '';
  return (
    <BaseNode
      label="Hub"
      color="#95a5a6"
      icon="◎"
      inputPins={data.inputPins as never}
      outputPins={data.outputPins as never}
    >
      {label && <div className="flow-node-text">{label}</div>}
    </BaseNode>
  );
}

export const HubNode = memo(HubNodeInner);
