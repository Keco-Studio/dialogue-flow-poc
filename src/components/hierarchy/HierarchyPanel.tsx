'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useGraphStore } from '@/stores/graphStore';
import { useUIStore } from '@/stores/uiStore';
import type { TreeNode, TreeNodeType } from '@/models/types';

const TREE_ICONS: Record<TreeNodeType, string> = {
  folder: '📁',
  chapter: '📖',
  arc: '📜',
  graphRef: '🔗',
  assetRef: '📎',
};

interface TreeItemProps {
  node: TreeNode;
  depth: number;
}

function TreeItem({ node, depth }: TreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const renameTreeNode = useProjectStore((s) => s.renameTreeNode);
  const removeTreeNode = useProjectStore((s) => s.removeTreeNode);
  const addTreeNode = useProjectStore((s) => s.addTreeNode);
  const setActiveGraph = useGraphStore((s) => s.setActiveGraph);
  const createGraph = useGraphStore((s) => s.createGraph);
  const navigationStack = useUIStore((s) => s.navigationStack);

  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renaming]);

  const handleDoubleClick = useCallback(() => {
    if (node.type === 'graphRef' && node.graphId) {
      // Clear navigation stack and open graph
      while (navigationStack.length > 0) {
        useUIStore.getState().popNavigation();
      }
      setActiveGraph(node.graphId);
    } else {
      setRenaming(true);
    }
  }, [node, navigationStack.length, setActiveGraph]);

  const handleRenameSubmit = useCallback(
    (value: string) => {
      if (value.trim()) {
        renameTreeNode(node.id, value.trim());
      }
      setRenaming(false);
    },
    [node.id, renameTreeNode],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleAddChild = useCallback(
    (type: TreeNodeType) => {
      if (type === 'graphRef') {
        const graphId = createGraph('New Graph');
        addTreeNode(node.id, 'graphRef', 'New Graph', graphId);
      } else {
        const name = type === 'folder' ? 'New Folder' : type === 'chapter' ? 'New Chapter' : 'New Arc';
        addTreeNode(node.id, type, name);
      }
      setExpanded(true);
      closeContextMenu();
    },
    [node.id, addTreeNode, createGraph, closeContextMenu],
  );

  const handleDelete = useCallback(() => {
    removeTreeNode(node.id);
    closeContextMenu();
  }, [node.id, removeTreeNode, closeContextMenu]);

  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="tree-item"
        style={{ paddingLeft: depth * 16 + 8 }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <button className="tree-toggle" onClick={() => setExpanded(!expanded)}>
          {hasChildren ? (expanded ? '▾' : '▸') : ' '}
        </button>
        <span className="tree-icon">{TREE_ICONS[node.type]}</span>
        {renaming ? (
          <input
            ref={renameRef}
            className="tree-name-input"
            defaultValue={node.name}
            onBlur={(e) => handleRenameSubmit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit((e.target as HTMLInputElement).value);
              if (e.key === 'Escape') setRenaming(false);
            }}
          />
        ) : (
          <span className="tree-name">{node.name}</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={closeContextMenu}
          />
          <div
            className="context-menu"
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
          >
            <button className="context-menu-item" onClick={() => handleAddChild('folder')}>
              📁 New Folder
            </button>
            <button className="context-menu-item" onClick={() => handleAddChild('chapter')}>
              📖 New Chapter
            </button>
            <button className="context-menu-item" onClick={() => handleAddChild('arc')}>
              📜 New Arc
            </button>
            <button className="context-menu-item" onClick={() => handleAddChild('graphRef')}>
              🔗 New Graph
            </button>
            <button className="context-menu-item" onClick={() => setRenaming(true)}>
              ✏️ Rename
            </button>
            <button className="context-menu-item" onClick={handleDelete}>
              🗑️ Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function HierarchyPanel() {
  const hierarchyRoot = useProjectStore((s) => s.hierarchyRoot);
  const addTreeNode = useProjectStore((s) => s.addTreeNode);
  const createGraph = useGraphStore((s) => s.createGraph);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleAddRoot = useCallback(
    (type: TreeNodeType) => {
      if (type === 'graphRef') {
        const graphId = createGraph('New Graph');
        addTreeNode(null, 'graphRef', 'New Graph', graphId);
      } else {
        const name = type === 'folder' ? 'New Folder' : type === 'chapter' ? 'New Chapter' : 'New Arc';
        addTreeNode(null, type, name);
      }
      closeContextMenu();
    },
    [addTreeNode, createGraph, closeContextMenu],
  );

  return (
    <div className="panel hierarchy-panel">
      <div className="panel-header">Navigator</div>
      <div className="panel-content" onContextMenu={handleContextMenu}>
        <div className="hierarchy-tree">
          {hierarchyRoot.map((node) => (
            <TreeItem key={node.id} node={node} depth={0} />
          ))}
          {hierarchyRoot.length === 0 && (
            <div className="empty-state">
              Right-click to add items
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={closeContextMenu}
          />
          <div
            className="context-menu"
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
          >
            <button className="context-menu-item" onClick={() => handleAddRoot('folder')}>
              📁 New Folder
            </button>
            <button className="context-menu-item" onClick={() => handleAddRoot('chapter')}>
              📖 New Chapter
            </button>
            <button className="context-menu-item" onClick={() => handleAddRoot('graphRef')}>
              🔗 New Graph
            </button>
          </div>
        </>
      )}
    </div>
  );
}
