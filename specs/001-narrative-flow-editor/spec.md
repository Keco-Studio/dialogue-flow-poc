# Feature Specification: Narrative Flow Editor

**Feature Branch**: `001-narrative-flow-editor`
**Created**: 2026-02-13
**Status**: Draft
**Input**: User description: "Build a web-based narrative design tool inspired by articy:draft's Flow view and Navigator hierarchy"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Edit a Branching Dialogue Graph (Priority: P1)

A narrative designer opens the application, creates a new project, and builds a branching dialogue scene. They add Line nodes for character speech, Choice nodes for player decisions, and connect them via pins. They edit node properties (speaker, text, choice labels) in the properties panel. They pan and zoom the canvas to navigate the growing graph.

**Why this priority**: The flow graph editor is the core value proposition. Without the ability to create, connect, and edit nodes on a canvas, the tool has no purpose.

**Independent Test**: Can be fully tested by creating a new project, adding 10+ nodes of various types, connecting them via pin-to-pin drag, editing properties, and verifying pan/zoom remains smooth.

**Acceptance Scenarios**:

1. **Given** an empty graph, **When** the user drags a Line node from the toolbar palette onto the canvas, **Then** a Line node appears at the drop position with default input/output pins.
2. **Given** a Line node with an output pin, **When** the user drags from the output pin to empty canvas space, **Then** a new node is created at the drop point and an edge connects the output pin to the new node's input pin.
3. **Given** two unconnected nodes, **When** the user drags from an output pin on node A to an input pin on node B, **Then** an edge is created connecting the two pins.
4. **Given** a Choice node with 3 outgoing edges, **When** the user clicks an edge, **Then** the properties panel shows the edge's label and color fields for editing.
5. **Given** a graph with 50+ nodes, **When** the user pans (right-mouse drag) and zooms (mouse wheel), **Then** the canvas responds at >= 55 fps with no visible lag.
6. **Given** a selected node, **When** the user presses Delete, **Then** the node and all its connected edges are removed.

---

### User Story 2 - Navigate Nested Container Graphs (Priority: P1)

A quest designer builds a multi-level quest flow. They create a Flow Fragment container representing "Act 1," submerge into it to build the inner quest steps, then emerge back to the top-level graph. A breadcrumb trail shows their current depth. Entry and exit points of the container are visible while editing inside.

**Why this priority**: Nesting is what differentiates this tool from a flat graph editor. Large narrative projects require hierarchical organization to remain manageable.

**Independent Test**: Can be fully tested by creating a container node, double-clicking to submerge, adding nodes inside, emerging back, and verifying the outer graph is unchanged.

**Acceptance Scenarios**:

1. **Given** a Flow Fragment node on the canvas, **When** the user double-clicks it, **Then** the editor submerges into the container's inner graph, showing a breadcrumb with the parent context.
2. **Given** the user is inside a nested container, **When** they click the "emerge" button or breadcrumb parent link, **Then** the editor returns to the parent graph with all state preserved.
3. **Given** a Dialogue Container with nodes inside, **When** the user views the container from the parent graph, **Then** the container node visually indicates it has inner content.
4. **Given** a 3-level deep nesting (project > container A > container B), **When** the user is inside container B, **Then** the breadcrumb shows "Project > Container A > Container B" and each level is clickable.

---

### User Story 3 - Organize Content in the Hierarchy Navigator (Priority: P2)

A lead designer organizes a large project using the hierarchy panel. They create folders for "Main Quest," "Side Quests," and "Cutscenes," then create chapters and arcs within each folder. They drag graphs between folders to reorganize. They click a graph in the hierarchy to open it in the editor.

**Why this priority**: The hierarchy is essential for managing projects with more than a handful of graphs, but the flow editor must work first.

**Independent Test**: Can be fully tested by creating a folder structure with multiple levels, creating graph references, dragging items between folders, and opening a graph from the hierarchy.

**Acceptance Scenarios**:

1. **Given** the hierarchy panel, **When** the user right-clicks and selects "New Folder," **Then** a new folder appears in the hierarchy with an editable name field.
2. **Given** a hierarchy with folders and graphs, **When** the user drags a graph from "Side Quests" to "Main Quest," **Then** the graph moves to the new folder and the hierarchy updates immediately.
3. **Given** a graph reference in the hierarchy, **When** the user double-clicks it, **Then** the graph opens in the flow editor.
4. **Given** a hierarchy item, **When** the user right-clicks and selects "Rename," **Then** the name becomes editable inline.

---

### User Story 4 - Export and Import Project (Priority: P2)

A lead designer exports their project to share with a writer for review. The writer imports the JSON file, makes text edits, exports again, and sends it back. Both round-trips preserve identical graph structure, node IDs, and positions.

**Why this priority**: Export/import is mandated by the constitution for tester collaboration. It is critical for early feedback loops but depends on the core data model being stable.

**Independent Test**: Can be fully tested by creating a project with multiple graphs, characters, and hierarchy structure, exporting to JSON, importing into a fresh session, and comparing the two projects field-by-field.

**Acceptance Scenarios**:

1. **Given** a project with graphs, nodes, edges, characters, and hierarchy, **When** the user clicks "Export," **Then** a JSON file is downloaded containing the full project state with deterministic ordering.
2. **Given** an exported JSON file, **When** the user clicks "Import" and selects the file, **Then** the project is restored with identical structure, IDs, positions, and properties.
3. **Given** a project exported, then imported, then exported again, **When** comparing the two JSON files, **Then** they are byte-identical (deterministic serialization).
4. **Given** an exported JSON file, **When** opened in a text editor, **Then** the format is human-readable with a schema version field at the root.

---

### User Story 5 - Create Nodes via Multiple Methods (Priority: P2)

A narrative designer uses multiple node creation workflows depending on context: dragging from the toolbar for initial layout, right-click context menu for quick additions, and pin-to-empty-canvas for building sequential flows rapidly.

**Why this priority**: Multiple creation methods are important for workflow efficiency, but the core single method (toolbar drag) is covered in US1.

**Independent Test**: Can be fully tested by creating nodes via each method (toolbar drag, context menu, pin-to-empty, multi-create from pin) and verifying each produces correctly positioned and connected nodes.

**Acceptance Scenarios**:

1. **Given** the canvas with right-click context menu open, **When** the user selects "New > Line," **Then** a Line node is created at the cursor position.
2. **Given** a node's output pin, **When** the user drags to empty space, **Then** a node type picker appears and the selected node type is created and connected.
3. **Given** a Choice node's output pin, **When** the user triggers multi-create (up to 4), **Then** multiple nodes are created in an auto-laid-out arrangement, each connected to the Choice node.

---

### User Story 6 - Validate Graph Structure (Priority: P3)

A lead designer reviews a large dialogue tree before export. The tool highlights warnings: a Choice node with only 1 outgoing edge, an End node with an accidental output connection, a Jump node without a configured target. Warnings appear in the UI but do not block export.

**Why this priority**: Validation helps catch errors but is a quality-of-life feature, not a core authoring capability.

**Independent Test**: Can be fully tested by creating nodes that violate each validation rule and verifying warnings appear in the UI without blocking any operations.

**Acceptance Scenarios**:

1. **Given** a Choice node with only 1 outgoing edge, **When** validation runs, **Then** a warning indicates "Choice node requires at least 2 outgoing edges with labels."
2. **Given** an End node with an outgoing edge, **When** validation runs, **Then** a warning indicates "End node must have 0 output connections."
3. **Given** a Jump node with no target configured, **When** validation runs, **Then** a warning indicates "Jump node requires a target."
4. **Given** a graph with validation warnings, **When** the user exports, **Then** export succeeds and warnings are included in the export metadata.

---

### User Story 7 - Undo/Redo Editor Actions (Priority: P2)

A writer accidentally deletes a section of dialogue nodes. They press Ctrl+Z to undo, restoring all deleted nodes and edges to their exact previous positions and connections. They press Ctrl+Y to redo if they change their mind.

**Why this priority**: Undo/redo is essential for user confidence but depends on the deterministic state model being established first.

**Independent Test**: Can be fully tested by performing a sequence of actions (create, move, delete, edit property), undoing each, and verifying exact state restoration.

**Acceptance Scenarios**:

1. **Given** the user deletes 3 connected nodes, **When** they press Ctrl+Z, **Then** all 3 nodes and their edges reappear at their original positions.
2. **Given** the user moves a node from position A to position B, **When** they press Ctrl+Z, **Then** the node returns to position A.
3. **Given** the user has undone an action, **When** they press Ctrl+Y, **Then** the action is re-applied exactly.
4. **Given** the user undoes, then performs a new action, **When** they press Ctrl+Y, **Then** redo is unavailable (the redo stack is cleared).

---

### Edge Cases

- What happens when a user deletes a container node that has inner graph content? The inner content MUST be deleted with it, with undo restoring everything.
- What happens when an edge references a pin on a deleted node? The edge MUST be removed. Broken edge references MUST NOT persist in the data model.
- What happens when importing a JSON file with a different schema version? The system MUST detect the version mismatch and either migrate or show a clear error message.
- What happens when the user drags a node to a position overlapping another node? Nodes MUST be allowed to overlap (no auto-snapping) but a visual indicator is recommended.
- What happens when a Jump node targets a node inside a different container? The Jump MUST store the full path to the target (container chain + node ID) for cross-container routing.
- What happens when the hierarchy has circular references (folder A inside folder B inside folder A)? The hierarchy model MUST prevent circular parent-child relationships.

## Requirements *(mandatory)*

### Functional Requirements

**Flow Graph Editor**
- **FR-001**: System MUST render a pannable, zoomable canvas displaying nodes and edges.
- **FR-002**: System MUST support creating nodes via toolbar drag, context menu, and pin-to-empty-canvas drag.
- **FR-003**: System MUST support connecting nodes by dragging from an output pin to an input pin.
- **FR-004**: System MUST support these node types: Dialogue Container, Flow Fragment, Line, Choice, Condition, Instruction, Jump, Hub, End, Annotation.
- **FR-005**: Pins MUST be first-class entities with unique IDs, direction (in/out), and optional condition/instruction expressions.
- **FR-006**: System MUST support nesting: container nodes have an inner graph that users can submerge into and emerge from.
- **FR-007**: System MUST display a breadcrumb trail showing the current nesting depth with clickable parent levels.
- **FR-008**: System MUST support multi-select via click+drag box selection.
- **FR-009**: System MUST support deleting selected nodes/edges.
- **FR-010**: System MUST support undo/redo for all state-changing operations.
- **FR-011**: Edges MUST have an editable label (choice text) and optional color property.
- **FR-012**: System MUST support creating up to 4 connected nodes from a single pin in one action (multi-create).
- **FR-013**: Pins with condition/instruction expressions MUST be visually distinct and show a tooltip preview on hover.

**Hierarchy Navigator**
- **FR-014**: System MUST display a tree-structured hierarchy panel with folders, chapters, arcs, and graph references.
- **FR-015**: Users MUST be able to create, rename, and delete hierarchy items.
- **FR-016**: Users MUST be able to reorder and reparent hierarchy items via drag-and-drop.
- **FR-017**: Double-clicking a graph reference in the hierarchy MUST open it in the flow editor.

**Properties Panel**
- **FR-018**: Selecting a node MUST display its type-specific properties in a side panel.
- **FR-019**: Selecting an edge MUST display its label and color properties in the side panel.
- **FR-020**: Property changes MUST be reflected immediately on the canvas.

**Characters**
- **FR-021**: System MUST maintain a project-level list of characters (id, name).
- **FR-022**: Line nodes MUST allow selecting a speaker from the character list.

**Import/Export**
- **FR-023**: System MUST export the entire project state as a single JSON file with deterministic key ordering and stable IDs.
- **FR-024**: System MUST import a JSON file and restore the project to an identical state.
- **FR-025**: The export format MUST include a schema version field.
- **FR-026**: Export/import MUST produce byte-identical output for the same project state (deterministic serialization).

**Keyboard Interactions**
- **FR-027**: Alt + Arrow keys MUST navigate to nearby nodes on the canvas.
- **FR-028**: Tab MUST cycle between node input areas and pins.
- **FR-029**: Delete key MUST remove selected nodes and their connected edges.

**Validation**
- **FR-030**: System MUST validate Choice nodes have >= 2 outgoing edges with non-empty labels.
- **FR-031**: System MUST validate End nodes have 0 output connections.
- **FR-032**: System MUST validate Jump nodes have exactly 1 configured target.
- **FR-033**: System MUST detect and flag broken edges (referencing deleted pins/nodes).
- **FR-034**: Validation warnings MUST be displayed in the UI but MUST NOT block any operations.

**Data Persistence**
- **FR-035**: Project state MUST be persisted to local browser storage automatically.
- **FR-036**: System MUST function fully offline after initial page load.

**Demo**
- **FR-037**: Repository MUST include a demo project template that showcases key features for tester onboarding.

### Key Entities

- **Project**: Top-level container holding all data; has id, name, timestamps, hierarchy root, character list, and graph collection.
- **Character**: Named entity representing a speaker in dialogue; referenced by Line nodes via speakerId.
- **TreeNode**: Hierarchy item representing organizational structure; types include folder, chapter, arc, graphRef, assetRef; supports nested children.
- **Graph**: A flow graph containing nodes and edges; can be top-level or nested inside a container node.
- **Node**: A visual element on the canvas with type, position, pins, and type-specific data payload.
- **Pin**: A connection point on a node with direction (in/out), optional name, and optional condition/instruction expression.
- **Edge**: A directional connection between two pins; carries a label (choice text) and optional color.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a complete branching dialogue with 10+ nodes, connections, and nested containers in under 10 minutes on first use.
- **SC-002**: Canvas pan and zoom MUST maintain >= 55 fps on a graph with 100+ nodes on a mid-range laptop.
- **SC-003**: Export then import of any project MUST produce byte-identical re-export (round-trip fidelity).
- **SC-004**: All node types (10 types) are creatable, connectable, and editable via the properties panel.
- **SC-005**: Users can organize content across a hierarchy 4+ levels deep with drag-and-drop reordering.
- **SC-006**: Undo/redo correctly restores exact prior state for all operations (position, properties, connections).
- **SC-007**: Users can navigate a 3-level nested container structure using submerge/emerge with breadcrumb in under 5 seconds per level transition.
- **SC-008**: Validation catches all defined error patterns (Choice <2 edges, End with outputs, Jump without target, broken edges) and displays warnings without blocking workflow.
- **SC-009**: The demo project template allows a new tester to explore all major features within 5 minutes of opening the application.

### Assumptions

- Target users are game development professionals familiar with visual scripting tools (articy:draft, Unreal Blueprints, Twine).
- The application runs in modern desktop browsers (Chrome, Firefox, Safari — latest two versions). Mobile is out of scope.
- Single-user, local-first operation per the project constitution. No authentication or user accounts required.
- Condition and instruction expressions on pins are stored as plain strings in v1; no expression parser or runtime evaluator is required.
- The Hub node type is included in v1 as a simple routing node (no special runtime behavior beyond acting as a connection point).
- Node positioning is manual (user-placed). No automatic layout algorithm is required in v1, except for the multi-create feature which auto-arranges up to 4 new nodes.
