import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Pin } from '@/models/types';

interface BaseNodeProps {
  label: string;
  color: string;
  icon?: string;
  children?: React.ReactNode;
  inputPins?: Pin[];
  outputPins?: Pin[];
  noHandles?: boolean;
}

function BaseNodeInner({
  label,
  color,
  icon,
  children,
  inputPins = [],
  outputPins = [],
  noHandles = false,
}: BaseNodeProps) {
  return (
    <div
      className="flow-node"
      style={{ borderColor: color, '--node-color': color } as React.CSSProperties}
    >
      <div className="flow-node-header" style={{ background: color }}>
        {icon && <span className="flow-node-icon">{icon}</span>}
        <span className="flow-node-label">{label}</span>
      </div>
      {children && <div className="flow-node-body">{children}</div>}

      {!noHandles &&
        inputPins.map((pin, i) => (
          <Handle
            key={pin.id}
            type="target"
            position={Position.Top}
            id={pin.id}
            className={pin.conditionExpr ? 'has-expression' : ''}
            style={{ left: `${((i + 1) / (inputPins.length + 1)) * 100}%` }}
            title={pin.conditionExpr ? `Condition: ${pin.conditionExpr}` : pin.name}
          />
        ))}

      {!noHandles &&
        outputPins.map((pin, i) => (
          <Handle
            key={pin.id}
            type="source"
            position={Position.Bottom}
            id={pin.id}
            className={pin.instructionExpr ? 'has-expression' : ''}
            style={{ left: `${((i + 1) / (outputPins.length + 1)) * 100}%` }}
            title={
              pin.instructionExpr
                ? `Instruction: ${pin.instructionExpr}`
                : pin.name
            }
          />
        ))}
    </div>
  );
}

export const BaseNode = memo(BaseNodeInner);
