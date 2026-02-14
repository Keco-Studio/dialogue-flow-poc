import { describe, it, expect } from 'vitest';
import { ProjectExportSchema } from '@/models/schemas';

const validExport = {
  schemaVersion: 1,
  id: 'proj1',
  name: 'Test Project',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  characters: [{ id: 'char1', name: 'Alice' }],
  hierarchyRoot: [
    {
      id: 'tree1',
      type: 'folder' as const,
      name: 'Root',
      children: [
        {
          id: 'tree2',
          type: 'graphRef' as const,
          name: 'Graph 1',
          children: [],
          graphId: 'graph1',
        },
      ],
    },
  ],
  graphs: [
    {
      id: 'graph1',
      name: 'Main',
      nodes: [
        {
          id: 'node1',
          type: 'line',
          position: { x: 100, y: 200 },
          inputPins: [{ id: 'pin1', nodeId: 'node1', direction: 'in' }],
          outputPins: [{ id: 'pin2', nodeId: 'node1', direction: 'out' }],
          data: { type: 'line', text: 'Hello' },
        },
      ],
      edges: [],
    },
  ],
};

describe('ProjectExportSchema', () => {
  it('validates a valid export', () => {
    const result = ProjectExportSchema.parse(validExport);
    expect(result.id).toBe('proj1');
    expect(result.graphs).toHaveLength(1);
  });

  it('rejects missing required fields', () => {
    const { name: _, ...noName } = validExport;
    expect(() => ProjectExportSchema.parse(noName)).toThrow();
  });

  it('rejects wrong types', () => {
    expect(() =>
      ProjectExportSchema.parse({ ...validExport, schemaVersion: 'one' }),
    ).toThrow();
  });

  it('validates recursive TreeNode', () => {
    const nested = {
      ...validExport,
      hierarchyRoot: [
        {
          id: 'a',
          type: 'folder',
          name: 'L1',
          children: [
            {
              id: 'b',
              type: 'folder',
              name: 'L2',
              children: [
                { id: 'c', type: 'graphRef', name: 'L3', children: [], graphId: 'graph1' },
              ],
            },
          ],
        },
      ],
    };
    const result = ProjectExportSchema.parse(nested);
    expect(result.hierarchyRoot[0].children).toHaveLength(1);
  });

  it('rejects invalid pin direction', () => {
    const bad = {
      ...validExport,
      graphs: [
        {
          ...validExport.graphs[0],
          nodes: [
            {
              ...validExport.graphs[0].nodes[0],
              inputPins: [{ id: 'p1', nodeId: 'n1', direction: 'sideways' }],
            },
          ],
        },
      ],
    };
    expect(() => ProjectExportSchema.parse(bad)).toThrow();
  });
});
