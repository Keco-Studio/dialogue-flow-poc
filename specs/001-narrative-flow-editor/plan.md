# Implementation Plan: Narrative Flow Editor

**Branch**: `001-narrative-flow-editor` | **Date**: 2026-02-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-narrative-flow-editor/spec.md`

## Summary

Build a web-based narrative design tool (articy:draft-inspired) as a Next.js App Router + TypeScript application. The core is a React Flow-powered graph editor with pin-based connections, nested container graphs (submerge/emerge), a hierarchy navigator, properties panel, and deterministic JSON export/import. State management uses Zustand with zundo for undo/redo. All data persists locally to IndexedDB.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 20
**Primary Dependencies**: Next.js 15 (App Router), React 19, @xyflow/react 12, Zustand 5, zundo 2, Zod 4, nanoid 5, idb-keyval 6
**Storage**: IndexedDB via idb-keyval (project data), localStorage (user preferences)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Modern desktop browsers (Chrome, Firefox, Safari — latest 2 versions)
**Project Type**: Web application (single Next.js project)
**Performance Goals**: >= 55 fps pan/zoom/drag with 100+ nodes; scoped re-renders
**Constraints**: Offline-capable after initial load; < 500 KB gzipped initial JS; single-user local-first
**Scale/Scope**: 100-1000 nodes per graph, 10+ graphs per project, 3+ nesting levels

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --- | --- | --- |
| I. Local-First, Single-User | PASS | No server/cloud. IndexedDB for persistence. Full offline after first load. |
| II. Minimal Architecture | PASS | Each dependency justified — see Complexity Tracking. State flows are linear: user action → Zustand set() → React re-render. No hidden global stores beyond the 3 explicit Zustand stores. |
| III. Performance Guardrails | PASS | React Flow provides viewport culling. Normalized maps + selectors for scoped re-renders. zundo drag filtering prevents per-frame undo snapshots. Perf budget defined. |
| IV. Deterministic Editor State | PASS | nanoid stable IDs. zundo snapshot undo/redo. Deterministic serializer with sorted keys/arrays. State mutations are discrete set() calls. |
| V. Mandatory Export/Import | PASS | JSON export with schema version. Zod validation on import. Migration pipeline. Available from M1. |

## Project Structure

### Documentation (this feature)

```text
specs/001-narrative-flow-editor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── export-schema.json
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── canvas/
│   │   ├── FlowCanvas.tsx
│   │   ├── NodeToolbar.tsx
│   │   ├── CanvasContextMenu.tsx
│   │   ├── Breadcrumb.tsx
│   │   ├── nodes/
│   │   │   ├── LineNode.tsx
│   │   │   ├── ChoiceNode.tsx
│   │   │   ├── ConditionNode.tsx
│   │   │   ├── InstructionNode.tsx
│   │   │   ├── ContainerNode.tsx
│   │   │   ├── JumpNode.tsx
│   │   │   ├── HubNode.tsx
│   │   │   ├── EndNode.tsx
│   │   │   ├── AnnotationNode.tsx
│   │   │   └── index.ts
│   │   └── edges/
│   │       └── LabeledEdge.tsx
│   ├── hierarchy/
│   │   └── HierarchyPanel.tsx
│   ├── properties/
│   │   ├── PropertiesPanel.tsx
│   │   ├── NodeProperties.tsx
│   │   └── EdgeProperties.tsx
│   └── shared/
│       ├── ExportImportButtons.tsx
│       └── ZoomControls.tsx
├── stores/
│   ├── graphStore.ts
│   ├── projectStore.ts
│   └── uiStore.ts
├── models/
│   ├── types.ts
│   ├── schemas.ts
│   └── defaults.ts
├── services/
│   ├── serializer.ts
│   ├── importer.ts
│   ├── migrations.ts
│   ├── validator.ts
│   └── persistence.ts
└── lib/
    ├── ids.ts
    └── stableStringify.ts

tests/
├── unit/
│   ├── graphStore.test.ts
│   ├── serializer.test.ts
│   ├── importer.test.ts
│   ├── migrations.test.ts
│   └── validator.test.ts
└── e2e/
    ├── canvas.spec.ts
    ├── connections.spec.ts
    ├── nesting.spec.ts
    └── exportImport.spec.ts
```

**Structure Decision**: Single Next.js project. No backend separation needed — the app is fully client-side with static export capability. The `src/` directory follows Next.js App Router conventions with co-located components, stores, and services.

## Implementation Milestones

### M0: Project Skeleton & Layout

**Goal**: Empty Next.js app with the three-panel layout shell.

- Initialize Next.js 15 + TypeScript project.
- Install dependencies: @xyflow/react, zustand, zundo, zod, nanoid, idb-keyval.
- Configure ESLint + Prettier.
- Set up Vitest + Playwright config.
- Build the app shell layout: left panel (hierarchy placeholder), center (canvas placeholder), right/left panel (properties placeholder). Use CSS Grid or flexbox with resizable panes.
- No functionality yet — just the visual skeleton.

### M1: Core Data Model + Export/Import + Persistence

**Goal**: The data layer works end-to-end. Export/import produces byte-identical round-trips.

- Define TypeScript types for all entities (models/types.ts).
- Define Zod schemas (models/schemas.ts).
- Implement `stableStringify` for deterministic JSON export.
- Implement serializer: project store → sorted JSON.
- Implement importer: JSON → Zod validation → migration → hydrate stores.
- Implement migrations framework (v1 baseline, empty migrations array).
- Implement IndexedDB persistence adapter for Zustand.
- Create Zustand stores (graphStore, projectStore, uiStore) with basic shape.
- Wire up auto-save to IndexedDB (debounced 1s).
- Unit tests: serialization round-trip, Zod validation, migration pipeline.

### M2: Basic Graph Editor + Properties Panel

**Goal**: Users can create nodes, connect them, edit properties, pan/zoom.

- Integrate React Flow with graphStore as source of truth.
- Implement custom node components for all 10 types (visual shells — type label + pins).
- Implement the mapping layer: domain Node/Pin → React Flow Node/Handle.
- Wire `onNodesChange` (position, selection, removal) to graphStore.
- Wire `onConnect` to create edges via graphStore.
- Implement toolbar palette: drag node type onto canvas to create.
- Implement PropertiesPanel: shows selected node's type-specific fields, selected edge's label/color.
- Wire property edits back to graphStore.
- Implement Delete key for selected nodes/edges.
- Verify pan (right-mouse) and zoom (wheel) work via React Flow defaults.

### M3: Pins + Edge Labels + Undo/Redo

**Goal**: Pins are first-class with condition/instruction editing. Edges have editable labels. Full undo/redo.

- Implement dynamic pin add/remove for Choice and Condition nodes.
- Pin condition/instruction expression editing (double-click pin → popover editor).
- Visual distinction for pins with expressions (highlight + tooltip).
- Edge label rendering via EdgeLabelRenderer (custom LabeledEdge component).
- Edge label editing in properties panel + inline double-click.
- Edge color property.
- Wire zundo temporal middleware onto graphStore.
- Implement drag filtering: pause temporal during `dragging: true`, resume on `dragging: false`.
- Ctrl+Z / Ctrl+Y keyboard shortcuts.
- Unit tests: undo/redo for create, move, delete, property edit, batch delete.

### M4: Nesting (Submerge/Emerge)

**Goal**: Container nodes have inner graphs. Users can navigate in and out.

- When creating a Dialogue Container or Flow Fragment, auto-create an inner Graph and link via `innerGraphId`.
- Double-click container → submerge: push current graph to navigation stack, display inner graph.
- Emerge button + breadcrumb clicks → pop navigation stack, restore parent graph + viewport.
- Breadcrumb component showing navigation stack as clickable path.
- Visual indicator on container nodes that have inner content (icon/badge).
- Handle container deletion: cascading delete of inner graph (single undo step).
- Handle viewport save/restore on submerge/emerge.

### M5: Hierarchy Navigator

**Goal**: Tree panel for organizing project content.

- Implement HierarchyPanel with tree rendering (folders, chapters, arcs, graphRefs).
- Right-click context menu: New Folder, New Chapter, New Arc, New Graph.
- Inline rename on double-click or context menu.
- Delete with confirmation for non-empty folders.
- Drag-and-drop reordering and reparenting (within the tree).
- Double-click graphRef → open graph in canvas (set activeGraphId).
- Wire hierarchy state to projectStore.
- Prevent circular parent-child relationships.

### M6: Validation + Node Creation Methods + Demo + Polish

**Goal**: Validation warnings, all creation methods, demo project, keyboard nav, e2e tests.

- Context menu on canvas: right-click → New → [node type] at cursor position.
- Pin-to-empty-canvas: drag from output pin to empty space → node type picker → create + connect.
- Multi-create: from a pin, create up to 4 nodes with auto-layout.
- Alt+Arrow key navigation to nearby nodes.
- Tab cycling between node inputs/pins.
- Box selection (multi-select) via React Flow's built-in selection box.
- Graph validation engine: Choice (>=2 edges), End (0 outputs), Jump (has target), broken edges.
- Validation warnings display in UI (non-blocking).
- Include warnings in export metadata (optional field).
- Create demo project template (JSON file + load-on-first-use logic).
- Zoom controls component.
- Character management (add/remove characters, assign to Line nodes).
- E2E tests with Playwright.

## Performance Plan

### Budget

| Metric | Target | Measurement |
| --- | --- | --- |
| Pan/zoom FPS | >= 55 fps with 100 nodes | Chrome DevTools Performance tab |
| Node drag FPS | >= 55 fps | Chrome DevTools |
| Initial load | < 2s on broadband | Lighthouse |
| Bundle size | < 500 KB gzipped | `next build` output |
| Undo/redo latency | < 50ms | Manual timing |

### Strategies

1. **Normalized maps** (`Record<string, T>`) — O(1) lookups, efficient selectors.
2. **Zustand selectors** — components subscribe only to their slice. `useShallow` for array selectors.
3. **React.memo on all custom node components** — prevents cascade re-renders.
4. **React Flow viewport culling** — only nodes in view are DOM-rendered.
5. **Drag throttling** — zundo temporal paused during drag; only final position recorded.
6. **Debounced persistence** — IndexedDB writes batched at 1s intervals.

### Profiling Checklist (run before each milestone merge)

- [ ] Record 10s of pan/zoom with 100 nodes → verify >= 55 fps.
- [ ] Record node drag with 100 nodes → verify no jank.
- [ ] Check React Profiler: no unnecessary re-renders of unrelated nodes.
- [ ] `next build` → verify JS bundle < 500 KB gzipped.
- [ ] Memory: open project with 500 nodes, check heap stays < 100 MB.

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| React Flow performance at 1000+ nodes | Canvas lag, unusable | Viewport culling (built-in), node memoization, normalized state. Fallback: canvas virtualization or lazy node rendering. |
| Nesting complexity in undo/redo | Container delete/undo loses inner graph state | Single atomic `set()` for cascading operations. Test undo of container delete explicitly. |
| React Flow handle limitations | Dynamic pin add/remove may cause edge orphaning | Track pin-edge relationships in store; clean up orphaned edges on pin removal. |
| zundo memory at scale | 100 snapshots × 500KB = 50MB | Configurable limit. Profile and reduce if needed. Consider diff-based history as future optimization. |
| Deterministic serialization edge cases | Floating-point positions cause diff noise | Round positions to 1 decimal place on export. Document in serializer. |
| Next.js SSR conflicts with React Flow | React Flow requires browser APIs (DOM measurements) | Use `"use client"` directive on all canvas components. Lazy-load React Flow with `next/dynamic` + `ssr: false` if needed. |

## Complexity Tracking

| Dependency | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| @xyflow/react | Graph rendering: pan/zoom, handles, custom nodes, edge routing, selection, minimap | Custom canvas would require months of work for basic editor features |
| zustand | Lightweight state management with selector-based re-renders | React Context re-renders entire tree on any change; Redux is heavier |
| zundo | Snapshot-based undo/redo with partialize + pause/resume | Manual command pattern requires paired execute/undo for every mutation — dozens of commands for 10 node types |
| zod | Schema validation for import with clear error messages + TypeScript inference | Manual validation is error-prone and doesn't generate types |
| nanoid | Compact, URL-safe unique IDs | UUID is 36 chars vs nanoid's 21; crypto.randomUUID() not available in all contexts |
| idb-keyval | Minimal IndexedDB wrapper (600 bytes) for key-value persistence | Raw IndexedDB requires verbose transaction management; Dexie.js is overkill for key-value storage |
