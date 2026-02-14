import { memo } from 'react';

function AnnotationNodeInner({ data }: { data: Record<string, unknown> }) {
  const text = (data.text as string) || '';
  const color = (data.color as string) || '#f5e642';
  return (
    <div
      className="flow-node annotation-node"
      style={{ background: color + '22', borderColor: color }}
    >
      <div className="flow-node-text" style={{ color }}>
        {text || '(note)'}
      </div>
    </div>
  );
}

export const AnnotationNode = memo(AnnotationNodeInner);
