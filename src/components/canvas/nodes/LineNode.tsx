import { memo } from 'react';
import { BaseNode } from './BaseNode';

function LineNodeInner({ data }: { data: Record<string, unknown> }) {
  const text = (data.text as string) || '';
  const speakerId = data.speakerId as string | undefined;
  return (
    <BaseNode
      label="Line"
      color="#4a9eff"
      icon="💬"
      inputPins={data.inputPins as never}
      outputPins={data.outputPins as never}
    >
      {speakerId && <div className="flow-node-detail">{speakerId}</div>}
      <div className="flow-node-text">{text || '(empty)'}</div>
    </BaseNode>
  );
}

export const LineNode = memo(LineNodeInner);
