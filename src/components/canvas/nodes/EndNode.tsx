import { memo } from 'react';
import { BaseNode } from './BaseNode';

function EndNodeInner({ data }: { data: Record<string, unknown> }) {
  return (
    <BaseNode
      label="End"
      color="#e74c3c"
      icon="⏹"
      inputPins={data.inputPins as never}
      outputPins={data.outputPins as never}
    />
  );
}

export const EndNode = memo(EndNodeInner);
