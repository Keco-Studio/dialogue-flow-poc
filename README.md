# Dialogue Flow Editor

A web-based narrative design tool inspired by [articy:draft](https://www.articy.com/articy-draft-3/)'s Flow view and Navigator hierarchy. Build branching dialogue graphs with a visual node editor, organize content in a hierarchical navigator, and export deterministic JSON for game engine integration.

## Features

- **Visual Flow Canvas** — Drag-and-drop node editor powered by React Flow with pan, zoom, and box selection
- **10 Node Types** — Line, Choice, Condition, Instruction, Jump, Hub, End, Annotation, Dialogue Container, Flow Fragment
- **Pin-Based Connections** — Dynamic pins with expressions, labeled edges, and inline editing
- **Container Nesting** — Submerge into container nodes to edit inner graphs with breadcrumb navigation
- **Hierarchy Navigator** — Tree panel for organizing folders, chapters, arcs, and graph references with drag-and-drop
- **Properties Panel** — Context-sensitive editing for nodes, edges, and characters
- **Undo/Redo** — Full history with drag batching via zundo temporal middleware
- **Export/Import** — Deterministic JSON serialization with Zod validation and schema migrations
- **Graph Validation** — Live warnings for structural issues (disconnected choices, missing targets, etc.)
- **IndexedDB Persistence** — Auto-saves project state to the browser

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript 5.x (strict mode) |
| Graph Editor | @xyflow/react 12 |
| State Management | Zustand 5 + zundo 2 (undo/redo) |
| Validation | Zod 4 |
| Persistence | idb-keyval 6 (IndexedDB) |
| IDs | nanoid 5 |
| Testing | Vitest (unit) + Playwright (e2e) |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). A demo project loads automatically on first launch.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run Playwright e2e tests |

## Project Structure

```
src/
  app/              # Next.js app router (layout, page, globals.css)
  components/
    canvas/         # Flow canvas, node renderers, edges, toolbar, overlays
    hierarchy/      # Navigator tree panel
    properties/     # Properties panel, node/edge editors, character manager
    shared/         # Export/import buttons, zoom controls
  lib/              # Utilities (ID generation, stable JSON stringify)
  models/           # Domain types, Zod schemas, default pin configs
  services/         # Serializer, importer, migrations, validator, persistence
  stores/           # Zustand stores (graphStore, projectStore, uiStore)
tests/
  unit/             # Vitest unit tests
  e2e/              # Playwright e2e tests
specs/              # Feature specifications and design documents
```

## License

Private
