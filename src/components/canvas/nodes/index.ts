import type { NodeTypes } from '@xyflow/react';
import { LineNode } from './LineNode';
import { ChoiceNode } from './ChoiceNode';
import { ConditionNode } from './ConditionNode';
import { InstructionNode } from './InstructionNode';
import { ContainerNode } from './ContainerNode';
import { JumpNode } from './JumpNode';
import { HubNode } from './HubNode';
import { EndNode } from './EndNode';
import { AnnotationNode } from './AnnotationNode';

export const nodeTypes: NodeTypes = {
  line: LineNode,
  choice: ChoiceNode,
  condition: ConditionNode,
  instruction: InstructionNode,
  dialogueContainer: ContainerNode,
  flowFragment: ContainerNode,
  jump: JumpNode,
  hub: HubNode,
  end: EndNode,
  annotation: AnnotationNode,
} as unknown as NodeTypes;
