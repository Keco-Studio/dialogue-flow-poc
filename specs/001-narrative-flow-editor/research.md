# Research: Narrative Flow Editor

**Phase 0 output** | **Date**: 2026-02-13

## R1: Graph Rendering Library

**Decision**: React Flow (`@xyflow/react` v12)

**Rationale**:
- MIT license, free for all use cases.
- Purpose-built for React node/edge editors with built-in pan/zoom, selection, minimap, custom node/edge renderers, and handles (pins).
- Handles map directly to our Pin concept: positioned on nodes, support source/target connections, custom styling, and dynamic add/remove via custom node components.
- Performance: renders only visible nodes by default (viewport culling). Tested to ~1000 nodes in production apps. For larger graphs, custom node memoization and `useShallow` selectors keep re-renders scoped.
- Does NOT have built-in nesting/subflow navigation. Nesting must be implemented by swapping the displayed graph data when submerging/emerging (acceptable — this keeps the library usage simple).
- Edge labels supported natively via `EdgeLabelRenderer`. Inline editing requires a custom editable label component (straightforward).
- Well-documented Zustand integration pattern in official examples.

**Alternatives considered**:
- **Rete.js**: More opinionated, heavier, plugin-based. Adds complexity without clear benefit for our use case.
- **Custom canvas (HTML Canvas / SVG)**: Maximum control but enormous implementation effort for v1. Constitution Principle II (Minimal Architecture) rejects this.
- **Cytoscape.js**: Analysis/visualization focused, not an editor. Lacks drag-to-connect, handle system.
- **Sigma.js / D3-force**: Visualization libraries, not interactive editors.

## R2: State Management & Undo/Redo

**Decision**: Zustand v5 + zundo v2 (temporal middleware)

**Rationale**:
- Zustand is minimal (~1KB), no boilerplate, supports selectors for scoped re-renders.
- zundo wraps store with `temporal()` middleware for automatic snapshot-based undo/redo.
- `partialize` option filters what's tracked (only graph data, not UI state).
- `pause()`/`resume()` handles drag-in-progress vs. drag-complete distinction — React Flow fires `onNodesChange` per frame during drag; only the final position should be an undo step.
- Single `set()` call = one undo step, so batching (e.g., delete 3 nodes) is natural.
- `limit: 100` snapshots at ~100-500KB each = 10-50MB max — acceptable for desktop browsers.

**Alternatives considered**:
- **Manual command pattern**: Every mutation needs paired execute/undo code. With 10 node types, pins, edges, nested containers — dozens of command classes. High bug surface. Rejected for v1.
- **Immer patches**: Memory-efficient diffs, but adds complexity. Consider only if profiling shows memory pressure at scale.
- **Redux Toolkit**: Heavier, more boilerplate, no clear advantage for single-user local app.

**Store architecture** (3 stores):
1. `useGraphStore` — temporal-wrapped: nodes, edges, pins (undoable).
2. `useProjectStore` — persist only: metadata, characters, hierarchy.
3. `useUIStore` — transient: viewport, selection, active panel, breadcrumb.

**React Flow integration pattern**:
- Store uses normalized maps (`Record<string, T>`) for O(1) lookups.
- Derive React Flow arrays via memoized selectors (`Object.values(nodeMap).map(toReactFlowNode)`).
- `onNodesChange` callback filters by `dragging` flag: pause temporal during drag, resume on drop.

## R3: IndexedDB Persistence

**Decision**: idb-keyval v6 + Zustand persist middleware with custom storage adapter

**Rationale**:
- idb-keyval is ~600 bytes, covers simple key-value get/set/del operations.
- Zustand's `persist` middleware with a custom `StateStorage` adapter pointing to idb-keyval provides seamless hydration on app load and debounced writes on state change.
- Full snapshot persistence (not incremental) is acceptable for v1 — a project with 1000 nodes serializes to ~200-500KB, well within IndexedDB limits.
- Undo history is NOT persisted (session-scoped). Only current state is saved.

**Alternatives considered**:
- **Dexie.js**: Full-featured IndexedDB wrapper with tables, indexes, queries. Overkill for v1 where we just need to store/retrieve whole project objects. Constitution Principle II rejects unnecessary complexity.
- **Raw IndexedDB API**: Verbose transaction management. idb-keyval wraps this cleanly.
- **localStorage**: 5MB limit per origin is too constraining for large projects.

**Persistence strategy**: Debounced writes (1s delay after last change). Full project snapshot per write.

## R4: Deterministic JSON Serialization

**Decision**: Custom `stableStringify` function using `JSON.stringify` with sorted keys + sorted arrays by ID

**Rationale**:
- `JSON.stringify(obj, null, 2)` preserves insertion order of keys. For determinism, we need a replacer that sorts keys alphabetically.
- Arrays of entities (nodes, edges, pins, hierarchy items) must be sorted by `id` before serialization.
- No library needed — a recursive key-sorting replacer is ~20 lines of code.
- Numbers: JavaScript's `JSON.stringify` produces consistent output for finite numbers. No special handling needed.

**Implementation sketch**:
```typescript
function stableStringify(obj: unknown): string {
  return JSON.stringify(obj, (_, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      );
    }
    return value;
  }, 2);
}
```

Arrays sorted by `id` field before passing to stringify (at the serialization boundary, not in the store).

**Alternatives considered**:
- **json-stable-stringify** / **fast-json-stable-stringify**: Library options. But adding a dependency for 20 lines violates Principle II. Write it inline.
- **Canonical JSON (RFC 8785)**: Overkill for file export. Standard JSON with sorted keys is sufficient.

## R5: Schema Versioning & Migrations

**Decision**: Integer version field + ordered migration functions array

**Rationale**:
- Export JSON includes `"schemaVersion": 1` at the root.
- Migrations are an ordered array: `migrations[0]` upgrades v1 → v2, `migrations[1]` upgrades v2 → v3, etc.
- On import, read `schemaVersion`, apply migrations sequentially from current to latest.
- Forward-compatible: new fields added with defaults; removed fields ignored during migration.
- Validate with Zod AFTER migration (always validates against the latest schema).

**Migration pattern**:
```typescript
const migrations: Array<(data: unknown) => unknown> = [
  // v1 → v2: example
  (data) => ({ ...data, schemaVersion: 2, newField: 'default' }),
];

function migrateToLatest(data: Record<string, unknown>): ProjectExport {
  let current = data;
  const version = (current.schemaVersion as number) ?? 1;
  for (let i = version - 1; i < migrations.length; i++) {
    current = migrations[i](current);
  }
  return latestSchema.parse(current); // Zod validation
}
```

## R6: Schema Validation

**Decision**: Zod v4

**Rationale**:
- TypeScript-first schema declaration with automatic type inference.
- Validation performance is adequate for import (one-time validation of ~200-500KB JSON).
- Produces clear, structured error messages for import failures.
- Schemas double as documentation of the export format.

**Alternatives considered**:
- **Valibot**: Smaller bundle, tree-shakeable. Good alternative but less ecosystem maturity.
- **AJV (JSON Schema)**: Fast but no TypeScript type inference. Requires maintaining separate types.
- **io-ts**: Functional style, less ergonomic than Zod.

## R7: React Flow Nesting Strategy

**Decision**: Graph swapping with breadcrumb navigation stack

**Rationale**:
- React Flow displays one flat graph at a time. Nesting is implemented at the application level.
- Container nodes (Dialogue Container, Flow Fragment) store an `innerGraphId` reference.
- Submerge: push current graph ID onto a navigation stack, load the inner graph into React Flow.
- Emerge: pop the navigation stack, load the parent graph.
- Breadcrumb UI built from the navigation stack.
- This approach is simple, performant (only one graph rendered at a time), and avoids React Flow's experimental sub-flow features.

**Key implementation detail**: When submerging, save the parent graph's viewport (pan/zoom position) so emerging restores the exact view. Store this in the UI store (transient, not undoable).

## R8: Testing Strategy

**Decision**: Vitest for unit tests + Playwright for e2e

**Rationale**:
- Vitest: Fast, native TypeScript support, Jest-compatible API, works with Next.js.
- Unit tests cover: store reducers, serialization/deserialization, migration functions, validation schemas.
- Playwright: Browser-based e2e tests can interact with the React Flow canvas (click, drag, keyboard).
- E2e tests cover: node creation, connection, pan/zoom, export/import round-trip, nesting navigation.

**Alternatives considered**:
- **Jest**: Slower startup, requires more configuration for TypeScript/ESM. Vitest preferred.
- **Cypress**: Good but Playwright has better multi-browser support and is lighter weight.
