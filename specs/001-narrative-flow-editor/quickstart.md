# Quickstart: Narrative Flow Editor

## Prerequisites

- Node.js >= 20
- npm >= 10 (or pnpm/yarn)

## Setup

```bash
# Clone and install
git clone <repo-url>
cd dialogue-flow-poc
npm install

# Start development server
npm run dev
# Open http://localhost:3000
```

## Development Commands

```bash
# Dev server (hot reload)
npm run dev

# Type checking
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Unit tests
npm run test

# Unit tests (watch mode)
npm run test:watch

# E2E tests (requires dev server running)
npm run test:e2e

# Build for production
npm run build
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (app shell)
│   └── page.tsx            # Main editor page
├── components/
│   ├── canvas/             # React Flow canvas + custom nodes
│   │   ├── FlowCanvas.tsx
│   │   ├── nodes/          # Custom node renderers (Line, Choice, etc.)
│   │   ├── edges/          # Custom edge renderer with labels
│   │   └── NodeToolbar.tsx # Palette for dragging new nodes
│   ├── hierarchy/          # Navigator tree panel
│   │   └── HierarchyPanel.tsx
│   ├── properties/         # Properties inspector panel
│   │   └── PropertiesPanel.tsx
│   └── shared/             # Breadcrumb, dialogs, etc.
├── stores/
│   ├── graphStore.ts       # Zustand + zundo: nodes, edges, pins
│   ├── projectStore.ts     # Zustand + persist: metadata, characters, hierarchy
│   └── uiStore.ts          # Zustand: viewport, selection, navigation stack
├── models/
│   ├── types.ts            # TypeScript types for all entities
│   ├── schemas.ts          # Zod schemas for validation
│   └── defaults.ts         # Default pin configs per node type
├── services/
│   ├── serializer.ts       # Deterministic JSON export
│   ├── importer.ts         # Import + migration + validation
│   ├── migrations.ts       # Schema version migration functions
│   ├── validator.ts        # Graph validation rules (warnings)
│   └── persistence.ts      # IndexedDB storage adapter
└── lib/
    ├── ids.ts              # nanoid wrapper for stable ID generation
    └── stableStringify.ts  # Deterministic JSON serializer
```

## How to Export/Import

### Export
1. Click the **Export** button in the toolbar (or File menu).
2. A `.json` file downloads containing the full project state.
3. The file is human-readable with sorted keys and sorted entity arrays.

### Import
1. Click the **Import** button in the toolbar (or File menu).
2. Select a `.json` file previously exported.
3. The project is validated against the schema and restored.
4. If the file uses an older schema version, migrations run automatically.
5. If validation fails, an error message shows what's wrong.

### Verifying Round-Trip Fidelity
```bash
# Export project → file1.json
# Import file1.json
# Export again → file2.json
diff file1.json file2.json  # Should be identical
```

## How to Use the Demo Template

On first launch (or from the welcome screen), select **"Load Demo Project"**. This creates a project with:
- A hierarchy with folders, chapters, and graph references.
- A sample dialogue graph with Line, Choice, and End nodes.
- A nested container demonstrating submerge/emerge.
- Sample characters for speaker assignment.

## Key Interactions

| Action                    | How                                               |
| ------------------------- | ------------------------------------------------- |
| Pan canvas                | Right-mouse drag                                  |
| Zoom                      | Mouse wheel, or zoom controls                     |
| Create node (palette)     | Drag from toolbar onto canvas                     |
| Create node (menu)        | Right-click canvas → New → [type]                 |
| Create node (from pin)    | Drag from output pin to empty space               |
| Connect nodes             | Drag from output pin to input pin                 |
| Select                    | Click node/edge; box-select with click+drag       |
| Delete                    | Select → Delete key                               |
| Edit properties           | Select node/edge → edit in Properties panel       |
| Submerge into container   | Double-click container node                       |
| Emerge to parent          | Click breadcrumb or emerge button                 |
| Undo                      | Ctrl+Z                                            |
| Redo                      | Ctrl+Y or Ctrl+Shift+Z                            |
| Navigate to nearby node   | Alt + Arrow keys                                  |

## Running Tests

### Unit Tests
```bash
npm run test
```
Tests cover:
- Store reducers (add/delete/move nodes, undo/redo)
- Serialization determinism (export → import → re-export = identical)
- Schema migrations (v1 → v2, etc.)
- Zod validation (valid and invalid project files)
- Graph validation rules (Choice, End, Jump warnings)

### E2E Tests
```bash
# Start dev server first
npm run dev

# In another terminal
npm run test:e2e
```
Tests cover:
- Node creation via palette drag, context menu, pin-to-empty
- Connection creation via pin drag
- Pan/zoom interactions
- Nesting: submerge/emerge cycle
- Export/import round-trip via file download/upload
