'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas from '@/components/canvas/FlowCanvas';
import NodeToolbar from '@/components/canvas/NodeToolbar';
import HierarchyPanel from '@/components/hierarchy/HierarchyPanel';
import PropertiesPanel from '@/components/properties/PropertiesPanel';
import ExportImportButtons from '@/components/shared/ExportImportButtons';
import { useProjectStore } from '@/stores/projectStore';
import { useGraphStore } from '@/stores/graphStore';
import { importProject } from '@/services/importer';

function useInitializeProject() {
  const projectId = useProjectStore((s) => s.id);
  const createProject = useProjectStore((s) => s.createProject);
  const createGraph = useGraphStore((s) => s.createGraph);
  const setActiveGraph = useGraphStore((s) => s.setActiveGraph);
  const activeGraphId = useGraphStore((s) => s.activeGraphId);

  useEffect(() => {
    if (!projectId) {
      // Try to load demo project on first launch
      fetch('/demo-project.json')
        .then((res) => {
          if (!res.ok) throw new Error('No demo');
          return res.text();
        })
        .then((json) => {
          importProject(json);
        })
        .catch(() => {
          // Fallback: create empty project
          createProject('My Project');
        });
    }
  }, [projectId, createProject]);

  useEffect(() => {
    if (projectId && !activeGraphId) {
      const graphId = createGraph('Main Graph');
      setActiveGraph(graphId);
    }
  }, [projectId, activeGraphId, createGraph, setActiveGraph]);
}

export default function Home() {
  useInitializeProject();

  return (
    <ReactFlowProvider>
      <div className="app-shell">
        <div className="toolbar">
          <span className="toolbar-title">Narrative Flow Editor</span>
          <ExportImportButtons />
        </div>
        <div className="app-panels">
          <div className="left-column">
            <HierarchyPanel />
            <NodeToolbar />
          </div>
          <FlowCanvas />
          <PropertiesPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
