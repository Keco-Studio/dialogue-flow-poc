import type { NodeType } from './types';

export interface DefaultPinConfig {
  inputCount: number;
  outputCount: number;
  outputNames?: string[];
}

export const DEFAULT_PINS: Record<NodeType, DefaultPinConfig> = {
  dialogueContainer: { inputCount: 1, outputCount: 1, outputNames: ['Exit'] },
  flowFragment: { inputCount: 1, outputCount: 1, outputNames: ['Exit'] },
  line: { inputCount: 1, outputCount: 1 },
  choice: { inputCount: 1, outputCount: 2, outputNames: ['Option 1', 'Option 2'] },
  condition: { inputCount: 1, outputCount: 2, outputNames: ['True', 'False'] },
  instruction: { inputCount: 1, outputCount: 1 },
  jump: { inputCount: 1, outputCount: 0 },
  hub: { inputCount: 1, outputCount: 1 },
  end: { inputCount: 1, outputCount: 0 },
  annotation: { inputCount: 0, outputCount: 0 },
};
