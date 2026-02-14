'use client';

import { useGraphStore } from '@/stores/graphStore';
import { useUIStore } from '@/stores/uiStore';
import NodeProperties from './NodeProperties';
import EdgeProperties from './EdgeProperties';
import CharacterManager from './CharacterManager';

export default function PropertiesPanel() {
  const selectedNodeIds = useUIStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useUIStore((s) => s.selectedEdgeIds);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  const selectedNode = selectedNodeIds.length === 1 ? nodes[selectedNodeIds[0]] : null;
  const selectedEdge = selectedEdgeIds.length === 1 ? edges[selectedEdgeIds[0]] : null;

  return (
    <div className="panel properties-panel">
      <div className="panel-header">Properties</div>
      <div className="panel-content">
        {selectedNode ? (
          <NodeProperties node={selectedNode} />
        ) : selectedEdge ? (
          <EdgeProperties edge={selectedEdge} />
        ) : (
          <>
            <div className="empty-state">Select a node or edge to edit its properties.</div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />
            <CharacterManager />
          </>
        )}
      </div>
    </div>
  );
}
