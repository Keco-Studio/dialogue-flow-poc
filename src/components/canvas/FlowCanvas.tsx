'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type ReactFlowInstance,
  type Node as RFNode,
  type Edge as RFEdge,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore, pauseHistory, resumeHistory } from '@/stores/graphStore';
import { useUIStore } from '@/stores/uiStore';
import { toReactFlowNode, resolveEdgeNodes } from './flowMappings';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges/LabeledEdge';
import Breadcrumb from './Breadcrumb';
import CanvasContextMenu from './CanvasContextMenu';
import ConnectEndPicker from './ConnectEndPicker';
import ValidationOverlay from './ValidationOverlay';

export default function FlowCanvas() {
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const isDragging = useRef(false);
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);
  const [connectEndPicker, setConnectEndPicker] = useState<{
    screenX: number;
    screenY: number;
    flowX: number;
    flowY: number;
    fromPinId: string;
  } | null>(null);
  const connectingFrom = useRef<string | null>(null);

  const activeGraphId = useGraphStore((s) => s.activeGraphId);
  const graphs = useGraphStore((s) => s.graphs);
  const allNodes = useGraphStore((s) => s.nodes);
  const allEdges = useGraphStore((s) => s.edges);
  const allPins = useGraphStore((s) => s.pins);

  const createNode = useGraphStore((s) => s.createNode);
  const moveNode = useGraphStore((s) => s.moveNode);
  const deleteNodes = useGraphStore((s) => s.deleteNodes);
  const createEdge = useGraphStore((s) => s.createEdge);
  const deleteEdges = useGraphStore((s) => s.deleteEdges);
  const setActiveGraph = useGraphStore((s) => s.setActiveGraph);
  const setSelection = useUIStore((s) => s.setSelection);
  const pushNavigation = useUIStore((s) => s.pushNavigation);
  const saveGraphViewport = useUIStore((s) => s.saveGraphViewport);
  const viewport = useUIStore((s) => s.viewport);

  const graph = graphs[activeGraphId];

  const rfNodes: RFNode[] = useMemo(() => {
    if (!graph) return [];
    const pinsArray = Object.values(allPins);
    return graph.nodeIds
      .map((id) => allNodes[id])
      .filter(Boolean)
      .map((node) => toReactFlowNode(node, pinsArray));
  }, [graph, allNodes, allPins]);

  const rfEdges: RFEdge[] = useMemo(() => {
    if (!graph) return [];
    return graph.edgeIds
      .map((id) => allEdges[id])
      .filter(Boolean)
      .map((edge) => {
        const { source, target } = resolveEdgeNodes(edge, allPins);
        return {
          id: edge.id,
          source,
          target,
          sourceHandle: edge.fromPinId,
          targetHandle: edge.toPinId,
          type: 'labeled',
          data: { label: edge.label, color: edge.color },
        };
      });
  }, [graph, allEdges, allPins]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const selectChanges = changes.filter((c) => c.type === 'select');
      if (selectChanges.length > 0) {
        const updated = applyNodeChanges(changes, rfNodes);
        const allSelected = updated.filter((n) => n.selected).map((n) => n.id);
        setSelection(allSelected, []);
      }

      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length > 0) {
        deleteNodes(removals.map((c) => c.id));
      }

      const posChanges = changes.filter(
        (c) => c.type === 'position' && c.position,
      );
      for (const change of posChanges) {
        if (change.type === 'position' && change.position) {
          moveNode(change.id, change.position);
        }
      }
    },
    [rfNodes, deleteNodes, moveNode, setSelection],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length > 0) {
        deleteEdges(removals.map((c) => c.id));
      }
    },
    [deleteEdges],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (connection.sourceHandle && connection.targetHandle) {
        createEdge(connection.sourceHandle, connection.targetHandle);
      }
    },
    [createEdge],
  );

  const onConnectStart = useCallback(
    (_event: MouseEvent | TouchEvent, params: { nodeId: string | null; handleId: string | null; handleType: string | null }) => {
      if (params.handleId && params.handleType === 'source') {
        connectingFrom.current = params.handleId;
      }
    },
    [],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const fromPinId = connectingFrom.current;
      connectingFrom.current = null;

      if (!fromPinId || !reactFlowRef.current) return;

      // Check if the connection was dropped on a valid target
      const target = event.target as HTMLElement;
      const isDroppedOnPane = target.classList.contains('react-flow__pane');
      if (!isDroppedOnPane) return;

      const clientX = 'clientX' in event ? event.clientX : event.changedTouches[0].clientX;
      const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;

      const flowPos = reactFlowRef.current.screenToFlowPosition({
        x: clientX,
        y: clientY,
      });

      setConnectEndPicker({
        screenX: clientX,
        screenY: clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
        fromPinId,
      });
    },
    [],
  );

  const onNodeDragStart = useCallback(() => {
    isDragging.current = true;
    pauseHistory();
  }, []);

  const onNodeDragStop = useCallback(() => {
    isDragging.current = false;
    resumeHistory();
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowRef.current) return;

      const position = reactFlowRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      createNode(type as import('@/models/types').NodeType, position);
    },
    [createNode],
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      if (!reactFlowRef.current) return;
      const flowPos = reactFlowRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setContextMenuPos({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
      });
    },
    [],
  );

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: RFNode) => {
      const nodeData = allNodes[node.id];
      if (!nodeData) return;

      if (
        (nodeData.data.type === 'dialogueContainer' || nodeData.data.type === 'flowFragment') &&
        nodeData.data.innerGraphId
      ) {
        // Submerge into container
        saveGraphViewport(activeGraphId, viewport);
        pushNavigation(activeGraphId);
        setActiveGraph(nodeData.data.innerGraphId);
      }
    },
    [allNodes, activeGraphId, viewport, saveGraphViewport, pushNavigation, setActiveGraph],
  );

  if (!activeGraphId) {
    return (
      <div className="panel canvas-panel">
        <div className="panel-header">Canvas</div>
        <div className="panel-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          No graph selected. Create a project or select a graph.
        </div>
      </div>
    );
  }

  return (
    <div className="panel canvas-panel">
      <div className="panel-header">Canvas — {graph?.name || 'Untitled'}</div>
      <Breadcrumb />
      <div className="panel-content">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onPaneContextMenu={onPaneContextMenu}
          onInit={(instance) => { reactFlowRef.current = instance; }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode="Delete"
          panOnDrag={[2]}
          zoomOnScroll
          selectionOnDrag
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} color="var(--border-color)" />
          <Controls />
        </ReactFlow>
        <ValidationOverlay graphId={activeGraphId} />
        <CanvasContextMenu position={contextMenuPos} onClose={() => setContextMenuPos(null)} />
        {connectEndPicker && (
          <ConnectEndPicker
            position={connectEndPicker}
            fromPinId={connectEndPicker.fromPinId}
            onClose={() => setConnectEndPicker(null)}
          />
        )}
      </div>
    </div>
  );
}
