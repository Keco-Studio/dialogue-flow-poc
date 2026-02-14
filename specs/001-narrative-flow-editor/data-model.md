# Data Model: Narrative Flow Editor

**Phase 1 output** | **Date**: 2026-02-13

## Entity Relationship Overview

```
Project (1)
├── characters: Character (0..*)
├── hierarchyRoot: TreeNode (1..*)
│   └── children: TreeNode (0..*)  [recursive]
└── graphs: Graph (1..*)
    ├── nodes: Node (0..*)
    │   ├── inputPins: Pin (1..*)
    │   └── outputPins: Pin (0..*)
    └── edges: Edge (0..*)
        ├── fromPinId → Pin
        └── toPinId → Pin
```

## Entities

### Project

| Field          | Type         | Constraints                       |
| -------------- | ------------ | --------------------------------- |
| id             | string       | nanoid, stable across round-trips |
| name           | string       | non-empty                         |
| schemaVersion  | number       | integer >= 1                      |
| createdAt      | string       | ISO 8601 datetime                 |
| updatedAt      | string       | ISO 8601 datetime                 |
| characters     | Character[]  | sorted by id in export            |
| hierarchyRoot  | TreeNode[]   | ordered by user arrangement       |
| graphs         | Graph[]      | sorted by id in export            |

### Character

| Field | Type   | Constraints              |
| ----- | ------ | ------------------------ |
| id    | string | nanoid                   |
| name  | string | non-empty, display label |

### TreeNode

| Field    | Type                                                         | Constraints                    |
| -------- | ------------------------------------------------------------ | ------------------------------ |
| id       | string                                                       | nanoid                         |
| type     | `"folder"` \| `"chapter"` \| `"arc"` \| `"graphRef"` \| `"assetRef"` | enum                           |
| name     | string                                                       | non-empty                      |
| children | TreeNode[]                                                   | ordered; no circular ancestors |
| graphId  | string \| undefined                                          | required when type=`graphRef`  |

**Validation rules**:
- `graphRef` nodes MUST have a `graphId` pointing to a valid Graph.
- A TreeNode MUST NOT appear as its own ancestor (no cycles).
- Children order is user-defined (drag-and-drop) and preserved in export.

### Graph

| Field | Type   | Constraints                                      |
| ----- | ------ | ------------------------------------------------ |
| id    | string | nanoid                                           |
| name  | string | non-empty                                        |
| nodes | Node[] | sorted by id in export                           |
| edges | Edge[] | sorted by id in export                           |

A Graph can be a top-level graph or the inner graph of a container node. Container nodes reference their inner graph via `innerGraphId`.

### Node

| Field      | Type             | Constraints                                  |
| ---------- | ---------------- | -------------------------------------------- |
| id         | string           | nanoid                                       |
| type       | NodeType (enum)  | see Node Types below                         |
| position   | `{ x: number, y: number }` | canvas coordinates                 |
| inputPins  | Pin[]            | at least 1 for most types (except Annotation)|
| outputPins | Pin[]            | 0 for End, varies for others                 |
| data       | NodeData (union) | type-specific payload                        |

### NodeType (enum)

```
"dialogueContainer" | "flowFragment" | "line" | "choice" |
"condition" | "instruction" | "jump" | "hub" | "end" | "annotation"
```

### Node Data (by type)

| NodeType             | Data fields                                           |
| -------------------- | ----------------------------------------------------- |
| `dialogueContainer`  | `{ innerGraphId: string, label?: string }`            |
| `flowFragment`       | `{ innerGraphId: string, label?: string }`            |
| `line`               | `{ speakerId?: string, text: string }`                |
| `choice`             | `{ prompt?: string }`                                 |
| `condition`          | `{ expression: string }`                              |
| `instruction`        | `{ expression: string }`                              |
| `jump`               | `{ targetNodeId?: string, targetPath?: string[] }`    |
| `hub`                | `{ label?: string }`                                  |
| `end`                | `{}`                                                  |
| `annotation`         | `{ text: string, color?: string }`                    |

**Jump `targetPath`**: Array of graph IDs forming the container chain from root to the target graph. Used for cross-container routing. Example: `["graphA", "graphB"]` means the target is in graphB which is inside a container in graphA.

### Pin

| Field            | Type                   | Constraints              |
| ---------------- | ---------------------- | ------------------------ |
| id               | string                 | nanoid                   |
| nodeId           | string                 | references parent Node   |
| direction        | `"in"` \| `"out"`      | enum                     |
| name             | string \| undefined    | optional display label   |
| conditionExpr    | string \| undefined    | for input pins           |
| instructionExpr  | string \| undefined    | for output pins          |

### Edge

| Field     | Type              | Constraints                    |
| --------- | ----------------- | ------------------------------ |
| id        | string            | nanoid                         |
| fromPinId | string            | references an output Pin       |
| toPinId   | string            | references an input Pin        |
| label     | string \| undefined | choice text for Choice edges |
| color     | string \| undefined | CSS color string             |

**Validation rules**:
- `fromPinId` MUST reference a Pin with direction `"out"`.
- `toPinId` MUST reference a Pin with direction `"in"`.
- Both pins MUST belong to nodes in the same Graph.

## Default Pin Configuration by Node Type

| NodeType             | Default Input Pins | Default Output Pins |
| -------------------- | ------------------ | ------------------- |
| `dialogueContainer`  | 1 (entry)          | 1 (exit)            |
| `flowFragment`       | 1 (entry)          | 1 (exit)            |
| `line`               | 1                  | 1                   |
| `choice`             | 1                  | 2 (min; user can add more) |
| `condition`          | 1                  | 2 (true/false)      |
| `instruction`        | 1                  | 1                   |
| `jump`               | 1                  | 0                   |
| `hub`                | 1                  | 1                   |
| `end`                | 1                  | 0                   |
| `annotation`         | 0                  | 0                   |

## In-Memory Store Shape (Normalized)

```typescript
// useGraphStore (temporal-wrapped for undo/redo)
interface GraphStoreState {
  // Current graph being displayed
  activeGraphId: string;

  // All graphs in the project (keyed by graph ID)
  graphs: Record<string, {
    id: string;
    name: string;
    nodeIds: string[];  // ordered
    edgeIds: string[];  // ordered
  }>;

  // All nodes across all graphs (flat map for O(1) lookup)
  nodes: Record<string, Node>;

  // All edges across all graphs (flat map)
  edges: Record<string, Edge>;

  // All pins across all graphs (flat map)
  pins: Record<string, Pin>;
}

// useProjectStore (persist only)
interface ProjectStoreState {
  id: string;
  name: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  characters: Record<string, Character>;
  hierarchyRoot: TreeNode[];
}

// useUIStore (transient)
interface UIStoreState {
  viewport: { x: number; y: number; zoom: number };
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  navigationStack: string[];  // graph IDs for breadcrumb
  activePanel: "properties" | "none";
  dragState: DragInfo | null;
}
```

## State Transitions

### Submerge into Container
1. Push `activeGraphId` onto `navigationStack`.
2. Save current viewport to a transient map (`graphViewports[activeGraphId]`).
3. Set `activeGraphId` to the container's `innerGraphId`.
4. Reset viewport to fit the inner graph.

### Emerge from Container
1. Pop `navigationStack` to get parent graph ID.
2. Set `activeGraphId` to the popped ID.
3. Restore saved viewport from `graphViewports[parentGraphId]`.

### Delete Container Node
1. Remove all nodes and edges in the inner graph.
2. Remove the inner graph from `graphs`.
3. Remove the container node and its connected edges from the parent graph.
4. All of this is a single `set()` call (one undo step).
