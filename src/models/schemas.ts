import { z } from 'zod';

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const PinSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  direction: z.enum(['in', 'out']),
  name: z.string().optional(),
  conditionExpr: z.string().optional(),
  instructionExpr: z.string().optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  fromPinId: z.string(),
  toPinId: z.string(),
  label: z.string().optional(),
  color: z.string().optional(),
});

export const NodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    'dialogueContainer',
    'flowFragment',
    'line',
    'choice',
    'condition',
    'instruction',
    'jump',
    'hub',
    'end',
    'annotation',
  ]),
  position: PositionSchema,
  inputPins: z.array(PinSchema),
  outputPins: z.array(PinSchema),
  data: z.record(z.string(), z.unknown()),
});

export const GraphSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
});

export const TreeNodeSchema: z.ZodType<{
  id: string;
  type: 'folder' | 'chapter' | 'arc' | 'graphRef' | 'assetRef';
  name: string;
  children: unknown[];
  graphId?: string;
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.enum(['folder', 'chapter', 'arc', 'graphRef', 'assetRef']),
    name: z.string().min(1),
    children: z.array(TreeNodeSchema),
    graphId: z.string().optional(),
  }),
);

export const ProjectExportSchema = z.object({
  schemaVersion: z.number().int().min(1),
  id: z.string(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  characters: z.array(CharacterSchema),
  hierarchyRoot: z.array(TreeNodeSchema),
  graphs: z.array(GraphSchema),
});

export type ProjectExport = z.infer<typeof ProjectExportSchema>;
