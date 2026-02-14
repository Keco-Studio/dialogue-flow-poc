'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Character, TreeNode, TreeNodeType } from '@/models/types';
import { generateId } from '@/lib/ids';
import { idbStorage } from '@/services/persistence';

interface ProjectStoreState {
  id: string;
  name: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  characters: Record<string, Character>;
  hierarchyRoot: TreeNode[];
}

interface ProjectStoreActions {
  createProject: (name?: string) => void;
  updateProjectName: (name: string) => void;

  addCharacter: (name: string) => string;
  removeCharacter: (characterId: string) => void;
  updateCharacter: (characterId: string, updates: Partial<Pick<Character, 'name'>>) => void;

  setHierarchy: (root: TreeNode[]) => void;
  addTreeNode: (parentId: string | null, type: TreeNodeType, name: string, graphId?: string) => string;
  removeTreeNode: (nodeId: string) => void;
  moveTreeNode: (nodeId: string, newParentId: string | null, newIndex: number) => void;
  renameTreeNode: (nodeId: string, name: string) => void;

  hydrate: (state: Partial<ProjectStoreState>) => void;
}

type ProjectStore = ProjectStoreState & ProjectStoreActions;

function findAndRemoveNode(
  nodes: TreeNode[],
  nodeId: string,
): { remaining: TreeNode[]; removed: TreeNode | null } {
  const result: TreeNode[] = [];
  let removed: TreeNode | null = null;

  for (const node of nodes) {
    if (node.id === nodeId) {
      removed = node;
    } else {
      const childResult = findAndRemoveNode(node.children, nodeId);
      if (childResult.removed) removed = childResult.removed;
      result.push({ ...node, children: childResult.remaining });
    }
  }

  return { remaining: result, removed };
}

function insertNode(
  nodes: TreeNode[],
  parentId: string | null,
  nodeToInsert: TreeNode,
  index: number,
): TreeNode[] {
  if (parentId === null) {
    const result = [...nodes];
    result.splice(index, 0, nodeToInsert);
    return result;
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      const newChildren = [...node.children];
      newChildren.splice(index, 0, nodeToInsert);
      return { ...node, children: newChildren };
    }
    return { ...node, children: insertNode(node.children, parentId, nodeToInsert, index) };
  });
}

function isDescendant(nodes: TreeNode[], ancestorId: string, targetId: string): boolean {
  for (const node of nodes) {
    if (node.id === ancestorId) {
      return containsNode(node.children, targetId);
    }
    if (isDescendant(node.children, ancestorId, targetId)) return true;
  }
  return false;
}

function containsNode(nodes: TreeNode[], nodeId: string): boolean {
  for (const node of nodes) {
    if (node.id === nodeId) return true;
    if (containsNode(node.children, nodeId)) return true;
  }
  return false;
}

function updateTreeNode(
  nodes: TreeNode[],
  nodeId: string,
  updater: (node: TreeNode) => TreeNode,
): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) return updater(node);
    return { ...node, children: updateTreeNode(node.children, nodeId, updater) };
  });
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      id: '',
      name: '',
      schemaVersion: 1,
      createdAt: '',
      updatedAt: '',
      characters: {},
      hierarchyRoot: [],

      createProject: (name = 'Untitled Project') => {
        const now = new Date().toISOString();
        set({
          id: generateId(),
          name,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
          characters: {},
          hierarchyRoot: [],
        });
      },

      updateProjectName: (name) => {
        set({ name, updatedAt: new Date().toISOString() });
      },

      addCharacter: (name) => {
        const id = generateId();
        set((state) => ({
          characters: { ...state.characters, [id]: { id, name } },
          updatedAt: new Date().toISOString(),
        }));
        return id;
      },

      removeCharacter: (characterId) => {
        set((state) => {
          const { [characterId]: _removed, ...rest } = state.characters;
          return { characters: rest, updatedAt: new Date().toISOString() };
        });
      },

      updateCharacter: (characterId, updates) => {
        set((state) => ({
          characters: {
            ...state.characters,
            [characterId]: { ...state.characters[characterId], ...updates },
          },
          updatedAt: new Date().toISOString(),
        }));
      },

      setHierarchy: (root) => {
        set({ hierarchyRoot: root, updatedAt: new Date().toISOString() });
      },

      addTreeNode: (parentId, type, name, graphId?) => {
        const id = generateId();
        const newNode: TreeNode = { id, type, name, children: [], graphId };

        set((state) => {
          let newRoot: TreeNode[];
          if (parentId === null) {
            newRoot = [...state.hierarchyRoot, newNode];
          } else {
            newRoot = updateTreeNode(state.hierarchyRoot, parentId, (node) => ({
              ...node,
              children: [...node.children, newNode],
            }));
          }
          return { hierarchyRoot: newRoot, updatedAt: new Date().toISOString() };
        });

        return id;
      },

      removeTreeNode: (nodeId) => {
        set((state) => {
          const { remaining } = findAndRemoveNode(state.hierarchyRoot, nodeId);
          return { hierarchyRoot: remaining, updatedAt: new Date().toISOString() };
        });
      },

      moveTreeNode: (nodeId, newParentId, newIndex) => {
        set((state) => {
          // Prevent circular: can't move a node into its own descendant
          if (newParentId && isDescendant(state.hierarchyRoot, nodeId, newParentId)) {
            return state;
          }

          const { remaining, removed } = findAndRemoveNode(state.hierarchyRoot, nodeId);
          if (!removed) return state;

          const newRoot = insertNode(remaining, newParentId, removed, newIndex);
          return { hierarchyRoot: newRoot, updatedAt: new Date().toISOString() };
        });
      },

      renameTreeNode: (nodeId, name) => {
        set((state) => ({
          hierarchyRoot: updateTreeNode(state.hierarchyRoot, nodeId, (node) => ({
            ...node,
            name,
          })),
          updatedAt: new Date().toISOString(),
        }));
      },

      hydrate: (newState) => {
        set(newState);
      },
    }),
    {
      name: 'project-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        id: state.id,
        name: state.name,
        schemaVersion: state.schemaVersion,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        characters: state.characters,
        hierarchyRoot: state.hierarchyRoot,
      }),
    },
  ),
);
