# Tasks: Narrative Flow Editor

**Input**: Design documents from `/specs/001-narrative-flow-editor/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/export-schema.json

**Organization**: Tasks are grouped by implementation phase (0–6) aligned with plan milestones. Story labels map tasks to spec user stories for traceability.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)

---

## Phase 0: Repo & Scaffolding

**Purpose**: Next.js app skeleton with tooling, test runners, and the three-panel app shell.

**Checkpoint**: `npm run dev` starts, three-panel layout renders, `npm run test` passes with 0 tests, `npm run lint` passes.

- [x] T001 Initialize Next.js 15 project with TypeScript and install all dependencies in project root

  **Intent**: Bootstrap the repository with a working Next.js app and all v1 dependencies.

  **Preconditions**: None (greenfield).

  **Deliverables**:
  - `package.json` with dependencies: next, react, react-dom, @xyflow/react, zustand, zundo, zod, nanoid, idb-keyval
  - `package.json` devDependencies: typescript, @types/react, @types/node, eslint, prettier, eslint-config-next, vitest, @vitejs/plugin-react, playwright, @playwright/test
  - `tsconfig.json` with strict mode, path aliases (`@/*` → `src/*`)
  - `next.config.ts`
  - `src/app/layout.tsx` (minimal root layout with HTML/body)
  - `src/app/page.tsx` (placeholder "Narrative Flow Editor" heading)
  - `src/app/globals.css` (CSS reset, dark theme base)

  **Acceptance criteria**:
  - `npm run dev` starts on localhost:3000 with no errors.
  - `npm run build` succeeds.
  - TypeScript strict mode enabled with no type errors.

  **Test plan**: Manual — verify dev server starts and page renders.

- [x] T002 [P] Configure ESLint, Prettier, and editor settings in project root

  **Intent**: Enforce consistent code style from the start.

  **Preconditions**: T001 complete.

  **Deliverables**:
  - `.eslintrc.json` (extends next/core-web-vitals + typescript rules)
  - `.prettierrc` (single quotes, trailing commas, 100 print width)
  - `.vscode/settings.json` (format on save, ESLint auto-fix)
  - npm scripts: `lint`, `lint:fix`, `format`, `format:check`

  **Acceptance criteria**: `npm run lint` and `npm run format:check` pass with zero violations on the starter code.

- [x] T003 [P] Configure Vitest and Playwright test runners in project root

  **Intent**: Set up unit and e2e test infrastructure so subsequent phases can add tests.

  **Preconditions**: T001 complete.

  **Deliverables**:
  - `vitest.config.ts` (jsdom environment, path aliases, include `tests/unit/**`)
  - `playwright.config.ts` (chromium only for speed, baseURL localhost:3000, include `tests/e2e/**`)
  - `tests/unit/.gitkeep`, `tests/e2e/.gitkeep`
  - npm scripts: `test`, `test:watch`, `test:e2e`

  **Acceptance criteria**: `npm run test` exits 0 (no tests found is OK). `npx playwright install chromium` succeeds.

- [x] T004 Build the three-panel app shell layout in src/app/

  **Intent**: Create the visual skeleton — left panel, center canvas area, right/left properties panel — with resizable panes.

  **Preconditions**: T001 complete.

  **Deliverables**:
  - `src/app/layout.tsx` (updated: app shell with CSS Grid, three columns)
  - `src/app/page.tsx` (updated: renders three panel placeholders)
  - `src/components/hierarchy/HierarchyPanel.tsx` (placeholder: "Navigator" heading)
  - `src/components/canvas/FlowCanvas.tsx` (placeholder: "Canvas" heading, `"use client"`)
  - `src/components/properties/PropertiesPanel.tsx` (placeholder: "Properties" heading)
  - `src/app/globals.css` (updated: panel layout styles, min-widths, resize handles)

  **Acceptance criteria**:
  - Three panels visible side by side on desktop viewport.
  - Center panel takes remaining space; side panels have fixed or resizable widths.
  - All panels marked `"use client"` where needed for future interactivity.

  **Test plan**: Manual — visual inspection at 1280px+ viewport.

---

## Phase 1: Data Model & Persistence

**Purpose**: Canonical domain types, Zustand stores with all graph actions, undo/redo via zundo, IndexedDB auto-save, and deterministic export/import with round-trip fidelity.

**Checkpoint**: Unit tests pass for store actions, serialization round-trip, undo/redo, and migration pipeline. Export → import → re-export produces byte-identical JSON.

- [x] T005 [P] Define all domain types and default pin configurations in src/models/

  **Intent**: Create the canonical TypeScript types matching the data model document, plus a defaults map for node-type → pin configuration.

  **Preconditions**: T001 complete.

  **Deliverables**:
  - `src/models/types.ts` — types for Project, Character, TreeNode, Graph, Node, NodeType, NodeData (discriminated union), Pin, Edge, Position
  - `src/models/defaults.ts` — `DEFAULT_PINS: Record<NodeType, { inputCount: number; outputCount: number; outputNames?: string[] }>` mapping each node type to its default pin layout (e.g., Choice → 1 in, 2 out named "Option 1"/"Option 2"; Condition → 1 in, 2 out named "True"/"False")
  - `src/lib/ids.ts` — `generateId()` wrapper around nanoid

  **Acceptance criteria**:
  - All entity types from data-model.md are represented.
  - NodeData is a discriminated union on `type` field — TypeScript narrows correctly.
  - `DEFAULT_PINS` covers all 10 node types.
  - `generateId()` returns 21-char nanoid strings.

  **Test plan**: Unit test `generateId()` returns unique strings. Type-level tests via `tsc --noEmit`.

- [x] T006 [P] Define Zod schemas for export/import validation in src/models/schemas.ts

  **Intent**: Zod schemas that match the export JSON contract (contracts/export-schema.json). Used for validating imported files.

  **Preconditions**: T005 complete (uses types for reference).

  **Deliverables**:
  - `src/models/schemas.ts` — Zod schemas: `PositionSchema`, `PinSchema`, `EdgeSchema`, `NodeSchema`, `GraphSchema`, `CharacterSchema`, `TreeNodeSchema` (recursive), `ProjectExportSchema` (top-level with schemaVersion)

  **Acceptance criteria**:
  - `ProjectExportSchema.parse(validJson)` succeeds for a valid export.
  - `ProjectExportSchema.parse(invalidJson)` throws `ZodError` with clear messages.
  - Schemas match contracts/export-schema.json field-for-field.

  **Test plan**: Unit tests in `tests/unit/schemas.test.ts` — test valid input passes, missing fields fail, wrong types fail, recursive TreeNode validates.

- [x] T007 Implement graphStore with all node/edge/pin actions in src/stores/graphStore.ts

  **Intent**: The core Zustand store holding all graph data (nodes, edges, pins, graphs) with actions for every mutation. Wrapped with zundo temporal middleware for undo/redo.

  **Preconditions**: T005 complete.

  **Deliverables**:
  - `src/stores/graphStore.ts` — Zustand store with temporal middleware:
    - State: `graphs`, `nodes`, `edges`, `pins`, `activeGraphId` (all as `Record<string, T>`)
    - Actions: `createGraph`, `createNode` (with default pins from defaults.ts), `deleteNodes` (cascading: removes connected edges + pins), `moveNode`, `updateNodeData`, `addPin`, `removePin` (cascading: removes connected edges), `updatePin`, `createEdge`, `deleteEdges`, `updateEdge` (label, color), `setActiveGraph`
    - zundo config: `partialize` to track only `graphs`, `nodes`, `edges`, `pins`; `limit: 100`; `equality` using `fast-deep-equal` or `JSON.stringify`
    - Drag filtering: export `pauseHistory`/`resumeHistory` functions wrapping temporal pause/resume

  **Acceptance criteria**:
  - `createNode("line", {x:100, y:200})` adds a node to the active graph with correct default pins.
  - `deleteNodes(["nodeA"])` removes the node, its pins, and all connected edges.
  - `removePin("pinX")` removes the pin and any edge referencing it.
  - Undo after `deleteNodes` restores the node, its pins, and edges.
  - Undo after `moveNode` restores the previous position.
  - Redo after undo re-applies the change.
  - `pauseHistory()` → multiple `moveNode` calls → `resumeHistory()` → undo reverts all moves as one step.

  **Test plan**: Unit tests in `tests/unit/graphStore.test.ts` — test each action, undo/redo for create/delete/move/property edit, batch undo via pause/resume, cascading deletes.

  **Performance notes**: Use normalized maps (`Record<string, T>`) for O(1) lookups. All mutations are single `set()` calls for atomic undo steps.

- [x] T008 [P] Implement projectStore and uiStore in src/stores/

  **Intent**: Create the project metadata store (characters, hierarchy, project info) with IndexedDB persistence, and the transient UI store (viewport, selection, navigation stack).

  **Preconditions**: T005 complete.

  **Deliverables**:
  - `src/stores/projectStore.ts` — Zustand store with persist middleware:
    - State: `id`, `name`, `schemaVersion`, `createdAt`, `updatedAt`, `characters` (Record), `hierarchyRoot` (TreeNode[])
    - Actions: `createProject`, `updateProjectName`, `addCharacter`, `removeCharacter`, `updateCharacter`, `setHierarchy`, `addTreeNode`, `removeTreeNode`, `moveTreeNode`, `renameTreeNode`
  - `src/stores/uiStore.ts` — Zustand store (no persistence, no temporal):
    - State: `viewport`, `selectedNodeIds`, `selectedEdgeIds`, `navigationStack`, `activePanel`, `graphViewports` (Record for viewport save/restore)
    - Actions: `setViewport`, `setSelection`, `pushNavigation`, `popNavigation`, `saveGraphViewport`, `restoreGraphViewport`
  - `src/services/persistence.ts` — custom `StateStorage` adapter using idb-keyval for IndexedDB

  **Acceptance criteria**:
  - `addCharacter({ name: "Alice" })` adds a character with generated ID.
  - `pushNavigation("graphA")` / `popNavigation()` manages the breadcrumb stack.
  - After page reload, projectStore state is hydrated from IndexedDB.
  - uiStore state is NOT persisted (transient).

  **Test plan**: Unit tests for projectStore actions. Persistence tested manually (or with idb-keyval mock).

- [x] T009 Implement deterministic serializer and importer with migrations in src/services/

  **Intent**: Export produces deterministic JSON. Import validates with Zod, applies migrations, and hydrates stores.

  **Preconditions**: T005, T006, T007, T008 complete.

  **Deliverables**:
  - `src/lib/stableStringify.ts` — `stableStringify(obj): string` with recursive key sorting, 2-space indent. Arrays of entities sorted by `id`. Positions rounded to 1 decimal.
  - `src/services/serializer.ts` — `exportProject(): string` reads from graphStore + projectStore, denormalizes into the export schema shape, applies stableStringify.
  - `src/services/importer.ts` — `importProject(json: string): void` parses JSON, runs migrations, validates with Zod, hydrates graphStore + projectStore.
  - `src/services/migrations.ts` — `migrateToLatest(data): ProjectExport` with ordered migration array (empty for v1; framework in place).

  **Acceptance criteria**:
  - Export of a project with 5 nodes, 3 edges, 2 characters, and hierarchy produces valid JSON matching the export schema.
  - Import of that JSON hydrates stores to identical state.
  - Re-export after import produces byte-identical JSON (round-trip test).
  - Import of a file with schemaVersion > current throws a clear "unsupported version" error.
  - Import of invalid JSON throws a clear Zod validation error.

  **Test plan**: Unit tests in `tests/unit/serializer.test.ts` and `tests/unit/importer.test.ts`:
  - Round-trip: create project → export → import → re-export → assert identical.
  - Migration: craft a v1 fixture, add a v1→v2 migration, verify migration runs.
  - Validation: test invalid inputs (missing fields, wrong types, bad schemaVersion).

- [x] T010 Wire Export/Import buttons into the app shell in src/components/shared/ExportImportButtons.tsx

  **Intent**: Add working Export and Import buttons so the export/import pipeline is usable from the UI.

  **Preconditions**: T004, T009 complete.

  **Deliverables**:
  - `src/components/shared/ExportImportButtons.tsx` — "Export" button triggers `exportProject()` → downloads `.json` file. "Import" button opens file picker → reads file → calls `importProject()`. Shows error toast/alert on import failure.
  - Update `src/app/page.tsx` to include ExportImportButtons in a toolbar area.

  **Acceptance criteria**:
  - Clicking Export downloads a `.json` file named `{projectName}.json`.
  - Clicking Import → selecting a valid file → project state changes.
  - Importing an invalid file shows an error message (does not crash).

  **Test plan**: Manual test for now. E2e test added in Phase 6.

---

## Phase 2: Flow Canvas MVP

**Purpose**: Integrate React Flow. Users can create nodes via toolbar drag, connect via pin drag, delete, pan/zoom. This is the core of US1.

**Checkpoint**: A user can create 10+ nodes of various types, connect them, drag to reposition, pan/zoom smoothly, and delete nodes. All at >= 55 fps with 50 nodes.

- [x] T011 [US1] Integrate React Flow with graphStore as source of truth in src/components/canvas/FlowCanvas.tsx

  **Intent**: Wire React Flow to render nodes/edges from graphStore. Map domain models to React Flow types. Handle `onNodesChange`, `onEdgesChange`, `onConnect`.

  **Preconditions**: T004, T007 complete.

  **Deliverables**:
  - `src/components/canvas/FlowCanvas.tsx` (updated) — React Flow instance with:
    - `"use client"` directive
    - Import `@xyflow/react/dist/style.css`
    - Memoized selectors to derive React Flow `Node[]` and `Edge[]` from graphStore
    - `onNodesChange` handler: position changes → `moveNode()` in store (with drag filtering via `pauseHistory`/`resumeHistory`)
    - `onEdgesChange` handler: removal → `deleteEdges()` in store
    - `onConnect` handler: → `createEdge()` in store
    - `deleteKeyCode="Delete"` for node/edge deletion
    - `panOnDrag={[2]}` (right-mouse pan), `zoomOnScroll={true}`
    - `selectionMode` for box selection
  - Helper: `src/components/canvas/flowMappings.ts` — `toReactFlowNode(node, pins)` and `toReactFlowEdge(edge)` mapping functions

  **Acceptance criteria**:
  - Nodes from graphStore render on canvas at correct positions.
  - Dragging a node updates position in graphStore (undo restores old position).
  - Connecting two handles creates an edge in graphStore.
  - Pressing Delete removes selected nodes/edges.
  - Right-mouse drag pans. Mouse wheel zooms.

  **Test plan**: Manual verification. E2e tests in Phase 6.

  **Performance notes**: Use `React.memo` on all node components. Use `useShallow` for array selectors. Pause undo history during drag.

- [x] T012 [US1] Implement custom node renderers for all 10 node types in src/components/canvas/nodes/

  **Intent**: Create visually distinct React components for each node type, with correct handle (pin) placement.

  **Preconditions**: T011 complete.

  **Deliverables**:
  - `src/components/canvas/nodes/LineNode.tsx` — displays speaker name + text preview, 1 input handle (top), 1 output handle (bottom)
  - `src/components/canvas/nodes/ChoiceNode.tsx` — displays prompt, N output handles (one per output pin, dynamically rendered)
  - `src/components/canvas/nodes/ConditionNode.tsx` — displays expression, 1 input, 2 outputs (True/False)
  - `src/components/canvas/nodes/InstructionNode.tsx` — displays expression, 1 input, 1 output
  - `src/components/canvas/nodes/ContainerNode.tsx` — displays label + "has inner graph" badge, 1 input (entry), 1 output (exit). Used for both `dialogueContainer` and `flowFragment`.
  - `src/components/canvas/nodes/JumpNode.tsx` — displays target reference, 1 input, 0 outputs
  - `src/components/canvas/nodes/HubNode.tsx` — displays label, 1 input, 1 output
  - `src/components/canvas/nodes/EndNode.tsx` — displays "END", 1 input, 0 outputs
  - `src/components/canvas/nodes/AnnotationNode.tsx` — displays text, no handles, styled as a note/sticky
  - `src/components/canvas/nodes/index.ts` — `nodeTypes` map for React Flow's `nodeTypes` prop
  - Each component wrapped in `React.memo`.

  **Acceptance criteria**:
  - All 10 node types render with visually distinct styling (different colors/icons/shapes).
  - Handles (pins) are positioned correctly and accept connections.
  - ChoiceNode renders dynamic number of output handles matching its output pins.
  - AnnotationNode has no handles and cannot be connected.

  **Test plan**: Manual — create one of each type and verify visual appearance + connectivity.

  **Performance notes**: All components must be `React.memo`-wrapped. Keep renders cheap — display data from props only, no store subscriptions inside node components.

- [x] T013 [US1] Implement custom edge renderer with labels in src/components/canvas/edges/LabeledEdge.tsx

  **Intent**: Render edges with optional label text and color. Labels displayed at edge midpoint.

  **Preconditions**: T011 complete.

  **Deliverables**:
  - `src/components/canvas/edges/LabeledEdge.tsx` — custom edge component using `EdgeLabelRenderer` to display edge label. Supports custom stroke color from edge data. Wrapped in `React.memo`.
  - Update `FlowCanvas.tsx` to register custom edge type.

  **Acceptance criteria**:
  - Edges with a `label` display the text at the midpoint.
  - Edges with a `color` render with that stroke color.
  - Edges without label/color render as default bezier curves.

- [x] T014 [US1] Implement node creation via toolbar palette drag in src/components/canvas/NodeToolbar.tsx

  **Intent**: A toolbar showing all node types that users can drag onto the canvas to create nodes.

  **Preconditions**: T011, T012 complete.

  **Deliverables**:
  - `src/components/canvas/NodeToolbar.tsx` — a sidebar or top bar listing all 10 node types as draggable items. Uses React DnD or HTML5 drag with React Flow's `onDrop`/`onDragOver` handlers.
  - Update `FlowCanvas.tsx` to handle `onDrop` → call `createNode(type, position)` on graphStore.

  **Acceptance criteria**:
  - Dragging "Line" from toolbar to canvas creates a Line node at the drop position.
  - All 10 node types are listed and draggable.
  - Created nodes have correct default pins.
  - Position is converted from screen coordinates to canvas coordinates (accounting for pan/zoom).

  **Test plan**: Manual — drag each node type, verify creation at correct position.

- [x] T015 [US1] Implement basic Properties Panel for node and edge editing in src/components/properties/

  **Intent**: When a node or edge is selected, show its editable properties in the right panel.

  **Preconditions**: T008 (uiStore selection), T011 complete.

  **Deliverables**:
  - `src/components/properties/PropertiesPanel.tsx` (updated) — reads selection from uiStore; if node selected, renders NodeProperties; if edge selected, renders EdgeProperties; if nothing selected, shows "Select a node or edge."
  - `src/components/properties/NodeProperties.tsx` — type-specific form fields:
    - Line: speaker dropdown (from characters), text textarea
    - Choice: prompt text input
    - Condition: expression text input
    - Instruction: expression text input
    - Container (both types): label text input
    - Jump: target node selector (dropdown or text input for now)
    - Hub: label text input
    - End: (no editable fields)
    - Annotation: text textarea, color picker
  - `src/components/properties/EdgeProperties.tsx` — label text input, color picker
  - All changes call corresponding graphStore actions (`updateNodeData`, `updateEdge`).

  **Acceptance criteria**:
  - Clicking a Line node shows speaker and text fields.
  - Editing the text field updates the node's data in graphStore immediately.
  - Clicking an edge shows label and color fields.
  - Editing edge label updates the label displayed on the canvas.
  - Selecting nothing shows the empty state message.

  **Test plan**: Manual — select each node type and verify correct fields appear and edits propagate.

---

## Phase 3: Pins & Advanced Edge Editing

**Purpose**: Make pins first-class with dynamic add/remove, condition/instruction expressions, visual highlighting, and pin-level tooltips. Complete the edge editing experience.

**Checkpoint**: Choice nodes can have pins added/removed. Pins with expressions are visually distinct. Edge labels editable inline. All pin/edge changes are undoable.

- [x] T016 [US1] Implement dynamic pin add/remove for Choice and Condition nodes in src/components/canvas/nodes/

  **Intent**: Users can add or remove output pins on Choice nodes (for more choice branches) and Condition nodes (for multi-output conditions).

  **Preconditions**: T012, T007 complete.

  **Deliverables**:
  - Update `ChoiceNode.tsx` — add "+" button to add output pin, "×" button on each pin (if > 2 pins) to remove. Calls `addPin(nodeId, "out")` / `removePin(pinId)` on graphStore.
  - Update `ConditionNode.tsx` — add "+" button for additional condition outputs (beyond True/False). Calls same store actions.
  - Verify that removing a pin cascades to remove connected edges (handled in graphStore T007).

  **Acceptance criteria**:
  - Choice node starts with 2 output pins. Clicking "+" adds a third. Clicking "×" on the third removes it.
  - Removing a pin that has a connected edge also removes the edge.
  - Undo after pin removal restores the pin and its edge.
  - Cannot remove below the minimum pin count (2 for Choice, 2 for Condition).

- [x] T017 [US1] Implement pin expression editing and visual highlighting in src/components/canvas/nodes/

  **Intent**: Double-clicking a pin opens a popover to edit condition/instruction expressions. Pins with expressions are visually highlighted and show tooltips.

  **Preconditions**: T016 complete.

  **Deliverables**:
  - Add a `PinPopover` component (inline in nodes or shared) — renders on double-click of a handle, shows a text input for conditionExpr (input pins) or instructionExpr (output pins). Calls `updatePin(pinId, { conditionExpr })` on graphStore.
  - Update all node components: handles with non-empty expression get a distinct CSS class (e.g., colored ring or icon).
  - Add `title` attribute (or custom tooltip) on handles showing expression preview on hover.

  **Acceptance criteria**:
  - Double-clicking an input pin shows a popover with "Condition" label and text input.
  - Entering `player.health > 0` and closing updates the pin in graphStore.
  - The pin handle visually changes (e.g., gets a yellow ring).
  - Hovering over the highlighted pin shows `player.health > 0` in a tooltip.

- [x] T018 [US1] Implement inline edge label editing via double-click in src/components/canvas/edges/

  **Intent**: Double-clicking an edge label makes it editable inline (in addition to properties panel editing).

  **Preconditions**: T013 complete.

  **Deliverables**:
  - Update `LabeledEdge.tsx` — on double-click of the label, render an `<input>` instead of text. On blur/Enter, update edge label via `updateEdge(edgeId, { label })`. On Escape, cancel.

  **Acceptance criteria**:
  - Double-clicking an edge label turns it into an editable input.
  - Pressing Enter saves the new label.
  - Pressing Escape cancels the edit.
  - The change is undoable.

---

## Phase 4: Nesting & Navigation (US2)

**Purpose**: Container nodes have inner graphs. Users can submerge/emerge with breadcrumb navigation and viewport restore.

**Checkpoint**: User can create a container, submerge 3 levels deep via double-click, edit inner graphs, and emerge via breadcrumb — all state preserved. Container deletion undoes correctly.

- [x] T019 [US2] Implement container inner graph creation and submerge/emerge navigation in src/stores/ and src/components/canvas/

  **Intent**: When creating a container node (dialogueContainer or flowFragment), auto-create an inner graph. Double-click to submerge. Breadcrumb + button to emerge. Viewport saved/restored.

  **Preconditions**: T007, T008, T011 complete.

  **Deliverables**:
  - Update `graphStore.ts` — `createNode` for container types: also calls `createGraph()` for the inner graph and sets `innerGraphId` in node data.
  - Update `graphStore.ts` — `deleteNodes` for container types: cascading delete of inner graph's nodes/edges/pins + the graph itself (single `set()` call).
  - Add actions to `uiStore.ts`: `submerge(innerGraphId)` — pushes current activeGraphId to navigationStack, saves viewport, sets new activeGraphId; `emerge()` — pops stack, restores viewport.
  - Update `FlowCanvas.tsx` — `onNodeDoubleClick` handler: if node is a container type, call `submerge(node.data.innerGraphId)`.
  - `src/components/canvas/Breadcrumb.tsx` — renders navigation stack as clickable path (graph names). Clicking a level calls `emerge()` repeatedly to that level.
  - Update `ContainerNode.tsx` — show visual badge (e.g., folder icon or node count) when inner graph has nodes.

  **Acceptance criteria**:
  - Creating a Flow Fragment auto-creates an empty inner graph.
  - Double-clicking the container submerges: canvas shows the (empty) inner graph, breadcrumb shows "Project > ContainerName".
  - Adding nodes inside the inner graph works normally.
  - Clicking the breadcrumb's parent level emerges back. Outer graph is unchanged.
  - 3-level nesting works: each level's breadcrumb is clickable.
  - Viewport (pan/zoom) is saved on submerge and restored on emerge.
  - Deleting a container with inner content removes everything. Undo restores everything.

  **Test plan**: Unit tests for submerge/emerge state transitions. Manual test for 3-level nesting round-trip.

---

## Phase 5: Hierarchy Navigator (US3)

**Purpose**: Tree panel for organizing project content — folders, chapters, arcs, graph references. CRUD + drag-and-drop + open graph in editor.

**Checkpoint**: User can build a multi-level hierarchy, drag items between folders, rename items, and double-click a graph ref to open it in the editor.

- [x] T020 [US3] Implement HierarchyPanel with tree rendering and CRUD in src/components/hierarchy/HierarchyPanel.tsx

  **Intent**: Render the projectStore's hierarchyRoot as an interactive tree. Support create, rename, delete, and drag-and-drop reorder/reparent.

  **Preconditions**: T004, T008 complete.

  **Deliverables**:
  - `src/components/hierarchy/HierarchyPanel.tsx` (updated) — recursive tree renderer:
    - Renders TreeNode[] with expand/collapse for folders.
    - Right-click context menu: "New Folder", "New Chapter", "New Arc", "New Graph" (creates graph + graphRef TreeNode). "Rename", "Delete".
    - Inline rename: double-click name or select "Rename" → editable text field.
    - Delete: removes TreeNode (and contained children). If graphRef, optionally delete the graph too (with confirmation).
    - Drag-and-drop: reorder siblings, reparent into folders. Calls `moveTreeNode(nodeId, newParentId, newIndex)` on projectStore.
    - Double-click graphRef: sets `activeGraphId` on graphStore to the referenced graph, clearing the navigation stack.
    - Icons per type: folder icon, document icon for chapters/arcs, graph icon for graphRefs.
  - Update `projectStore.ts` if needed: ensure `addTreeNode`, `removeTreeNode`, `moveTreeNode`, `renameTreeNode` handle all cases including circular-parent prevention.

  **Acceptance criteria**:
  - Right-click → "New Folder" creates a folder at the clicked level.
  - "New Graph" creates a graph in graphStore and a graphRef in the hierarchy.
  - Dragging a graphRef from one folder to another moves it.
  - Double-clicking a graphRef opens that graph in the canvas.
  - Renaming a hierarchy item updates it immediately.
  - Deleting a non-empty folder shows confirmation.
  - Cannot drag a folder into its own descendant (circular prevention).

  **Test plan**: Manual — build a 4-level hierarchy, drag items, rename, delete, open graphs. Unit test circular prevention logic.

---

## Phase 6: Node Creation Methods, Validation, Demo & E2E (US5, US6, US7)

**Purpose**: Context menu creation, pin-to-empty, multi-create, keyboard navigation, graph validation warnings, demo project template, character management, and end-to-end tests.

**Checkpoint**: All spec acceptance criteria are met. E2E tests pass. Demo project loads on first use.

- [x] T021 [US5] Implement context menu node creation in src/components/canvas/CanvasContextMenu.tsx

  **Intent**: Right-click on empty canvas shows a menu with "New > [node type]" options, creating the node at cursor position.

  **Preconditions**: T011 complete.

  **Deliverables**:
  - `src/components/canvas/CanvasContextMenu.tsx` — context menu triggered by `onPaneContextMenu` on React Flow. Lists all 10 node types. Clicking one calls `createNode(type, canvasPosition)`.
  - Update `FlowCanvas.tsx` to wire `onPaneContextMenu`.

  **Acceptance criteria**:
  - Right-click on empty canvas shows context menu with all node types.
  - Selecting "Line" creates a Line node at the right-click position.
  - Menu closes after selection or on click-away.

- [x] T022 [US5] Implement pin-to-empty-canvas node creation and multi-create in src/components/canvas/

  **Intent**: Dragging from an output pin to empty space shows a node type picker. Creating a node auto-connects it. Multi-create allows creating up to 4 nodes from one pin.

  **Preconditions**: T011, T014 complete.

  **Deliverables**:
  - Update `FlowCanvas.tsx` — `onConnectEnd` handler: if the connection was dropped on empty canvas (no target handle), show a node type picker popup at the drop position.
  - Node type picker component (inline or popup) — user selects a type → `createNode(type, position)` + `createEdge(fromPinId, newNodeInputPinId)`.
  - Multi-create mode: from the picker, user can select "Create 2/3/4" → creates N nodes in a fan layout below the source pin, each connected.

  **Acceptance criteria**:
  - Dragging from an output pin to empty space shows a type picker.
  - Selecting a type creates a connected node at the drop position.
  - Multi-create from a Choice pin creates 2-4 nodes in a fan arrangement, each connected.
  - All created nodes have correct default pins.

- [x] T023 [US1] Implement keyboard shortcuts for node navigation and interaction in src/components/canvas/

  **Intent**: Alt+Arrow navigation to nearby nodes, Tab cycling between pins/inputs, zoom controls.

  **Preconditions**: T011 complete.

  **Deliverables**:
  - Add keyboard event handlers to `FlowCanvas.tsx`:
    - Alt+Arrow: find nearest node in that direction from current selection, select it, and pan to center it.
    - Tab: cycle focus between selected node's input fields and pins (requires focusable elements in node components).
  - `src/components/shared/ZoomControls.tsx` — zoom in/out/fit-view buttons. Wire to React Flow's `useReactFlow().zoomIn/zoomOut/fitView`.
  - Add ZoomControls to the canvas overlay.

  **Acceptance criteria**:
  - With a node selected, Alt+Right selects the nearest node to the right.
  - Zoom buttons zoom in, zoom out, and fit all nodes in view.

- [x] T024 [US6] Implement graph validation engine and warning display in src/services/validator.ts

  **Intent**: Validate graph structure against rules, display non-blocking warnings in the UI, and optionally include warnings in export metadata.

  **Preconditions**: T007 complete.

  **Deliverables**:
  - `src/services/validator.ts` — `validateGraph(graphId): ValidationWarning[]` with rules:
    - Choice nodes with < 2 outgoing edges → warning
    - Choice edges without non-empty labels → warning
    - End nodes with > 0 output edges → warning
    - Jump nodes without `targetNodeId` → warning
    - Edges referencing non-existent pins → warning (broken edges)
  - Update `FlowCanvas.tsx` or add a `ValidationOverlay` component — shows warning count badge. Clicking it shows a list of warnings. Each warning links to the offending node (selects + pans to it).
  - Update `serializer.ts` — optionally include `warnings` array in export JSON (alongside but outside the validated schema).

  **Acceptance criteria**:
  - A Choice node with 1 outgoing edge triggers a warning.
  - An End node with an output edge triggers a warning.
  - A Jump node with no target triggers a warning.
  - Warnings display in the UI without blocking any operations.
  - Export includes warnings in metadata.

  **Test plan**: Unit tests in `tests/unit/validator.test.ts` — test each rule with valid and invalid graphs.

- [x] T025 Implement character management in the Properties Panel in src/components/properties/

  **Intent**: Users can add/remove characters at the project level and assign speakers to Line nodes.

  **Preconditions**: T008, T015 complete.

  **Deliverables**:
  - Add a "Characters" section to PropertiesPanel (or as a project-level settings panel):
    - List all characters with name editable inline.
    - "Add Character" button → creates character with default name.
    - "Remove" button per character (with confirmation if referenced by Line nodes).
  - Update `NodeProperties.tsx` for Line nodes — speaker dropdown populated from projectStore characters.

  **Acceptance criteria**:
  - User can add a character "Alice" and see it in the list.
  - Selecting a Line node shows a speaker dropdown with "Alice" as an option.
  - Removing a referenced character clears the speakerId on affected Line nodes (or warns).

- [x] T026 Create demo project template and first-launch loading in src/services/

  **Intent**: Include a demo project JSON file that loads automatically on first launch, showcasing key features.

  **Preconditions**: T009, T019, T020 complete.

  **Deliverables**:
  - `public/demo-project.json` — a hand-crafted (or script-generated) project with:
    - Hierarchy: "Demo" folder > "Chapter 1" > dialogue graph ref
    - A dialogue graph with ~15 nodes: Line → Choice (3 branches) → Line endings → End nodes
    - A nested Flow Fragment container with inner nodes
    - 3 characters (Narrator, Player, NPC)
    - Edge labels on choice branches
    - A Jump node targeting back to an earlier node
  - Update app initialization logic: on first load (no existing project in IndexedDB), auto-import demo-project.json.

  **Acceptance criteria**:
  - First-time user sees the demo project loaded with hierarchy, characters, and a graph.
  - The demo graph demonstrates Line, Choice, End, container nesting, and Jump.
  - Exporting and re-importing the demo produces byte-identical output.

- [x] T027 Add Playwright e2e tests for core workflows in tests/e2e/

  **Intent**: Automated end-to-end tests covering the critical user journeys.

  **Preconditions**: All previous tasks complete.

  **Deliverables**:
  - `tests/e2e/canvas.spec.ts` — test node creation (toolbar drag), node deletion, pan/zoom interaction
  - `tests/e2e/connections.spec.ts` — test pin-to-pin connection, edge label editing, edge deletion
  - `tests/e2e/nesting.spec.ts` — test container creation, submerge, add inner nodes, emerge, verify outer state
  - `tests/e2e/exportImport.spec.ts` — test export button downloads file, import restores state

  **Acceptance criteria**:
  - All e2e tests pass in CI (headless Chromium).
  - Tests cover the 4 critical flows: create/connect, nesting, export/import, deletion.

  **Test plan**: This IS the test plan. Run via `npm run test:e2e`.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 0 (Scaffolding)
  └─► Phase 1 (Data Model) ──► Phase 2 (Canvas MVP) ──► Phase 3 (Pins/Edges)
                               │                         │
                               └─► Phase 4 (Nesting) ◄───┘
                               └─► Phase 5 (Hierarchy)
                                                          └─► Phase 6 (Validation/Demo/E2E)
```

- **Phase 0**: No dependencies — start immediately.
- **Phase 1**: Depends on Phase 0 (T001).
- **Phase 2**: Depends on Phase 1 (stores must exist).
- **Phase 3**: Depends on Phase 2 (node components must exist).
- **Phase 4**: Depends on Phase 2 (canvas must work). Can run in parallel with Phase 3.
- **Phase 5**: Depends on Phase 1 (projectStore). Can run in parallel with Phases 3–4.
- **Phase 6**: Depends on Phases 2–5 (all features for e2e tests). T021–T023 can start after Phase 2.

### Parallel Opportunities

Within Phase 0: T002, T003 parallel after T001.
Within Phase 1: T005, T006 parallel. T007, T008 parallel after T005.
Within Phase 2: T012, T013, T014 parallel after T011.
Across phases: Phase 4 (T019) and Phase 5 (T020) can start once Phase 2 is complete.
Phase 6: T021, T022, T023, T024, T025 are all parallel (different files).

---

## Implementation Strategy

### MVP First (Phase 0 + 1 + 2)

1. Complete Phase 0: Skeleton with layout.
2. Complete Phase 1: Working data layer with export/import.
3. Complete Phase 2: Canvas with node creation, connection, properties, pan/zoom.
4. **STOP and DEMO**: At this point, US1 (core graph editing) and US4 (export/import) are functional.

### Incremental Delivery

1. Phase 0 + 1 → Data layer demo (export/import from code).
2. + Phase 2 → Visual graph editor demo (MVP!).
3. + Phase 3 → Complete pin/edge editing experience.
4. + Phase 4 → Nesting navigation demo.
5. + Phase 5 → Hierarchy organization demo.
6. + Phase 6 → Full feature set with validation + demo project + tests.

Each phase produces a deployable, testable increment.

---

## Summary

| Phase | Tasks | Key Deliverable |
| --- | --- | --- |
| 0 — Scaffolding | T001–T004 | Next.js app with three-panel layout |
| 1 — Data Model | T005–T010 | Stores, undo/redo, export/import, persistence |
| 2 — Canvas MVP | T011–T015 | React Flow graph editor with all node types |
| 3 — Pins/Edges | T016–T018 | Dynamic pins, expressions, inline edge editing |
| 4 — Nesting | T019 | Submerge/emerge with breadcrumb |
| 5 — Hierarchy | T020 | Navigator tree with CRUD + drag-and-drop |
| 6 — Polish | T021–T027 | Context menu, multi-create, validation, demo, e2e |
| **Total** | **27 tasks** | |
