export interface Position {
  x: number;
  y: number;
}

export type NodeType =
  | 'dialogueContainer'
  | 'flowFragment'
  | 'line'
  | 'choice'
  | 'condition'
  | 'instruction'
  | 'jump'
  | 'hub'
  | 'end'
  | 'annotation';

export type PinDirection = 'in' | 'out';

export interface Pin {
  id: string;
  nodeId: string;
  direction: PinDirection;
  name?: string;
  conditionExpr?: string;
  instructionExpr?: string;
}

export interface Edge {
  id: string;
  fromPinId: string;
  toPinId: string;
  label?: string;
  color?: string;
}

// Discriminated union for node data
export interface DialogueContainerData {
  type: 'dialogueContainer';
  innerGraphId: string;
  label?: string;
}

export interface FlowFragmentData {
  type: 'flowFragment';
  innerGraphId: string;
  label?: string;
}

export interface LineData {
  type: 'line';
  speakerId?: string;
  text: string;
}

export interface ChoiceData {
  type: 'choice';
  prompt?: string;
}

export interface ConditionData {
  type: 'condition';
  expression: string;
}

export interface InstructionData {
  type: 'instruction';
  expression: string;
}

export interface JumpData {
  type: 'jump';
  targetNodeId?: string;
  targetPath?: string[];
}

export interface HubData {
  type: 'hub';
  label?: string;
}

export interface EndData {
  type: 'end';
}

export interface AnnotationData {
  type: 'annotation';
  text: string;
  color?: string;
}

export type NodeData =
  | DialogueContainerData
  | FlowFragmentData
  | LineData
  | ChoiceData
  | ConditionData
  | InstructionData
  | JumpData
  | HubData
  | EndData
  | AnnotationData;

export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  graphId: string;
}

export interface Graph {
  id: string;
  name: string;
  nodeIds: string[];
  edgeIds: string[];
}

export type TreeNodeType = 'folder' | 'chapter' | 'arc' | 'graphRef' | 'assetRef';

export interface TreeNode {
  id: string;
  type: TreeNodeType;
  name: string;
  children: TreeNode[];
  graphId?: string;
}

export interface Character {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  characters: Record<string, Character>;
  hierarchyRoot: TreeNode[];
}
