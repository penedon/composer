# Adaptive Sidebar Update — Implementation Plan

## Goal

Replace the equal-weight, seven-step phase rail with navigation that supports both the song's initial setup and the repeated writing loop, while leaving every workspace unchanged.

The implementation follows the approved concept in `design/screens/24-adaptive-song-sidebar.svg`:

- Story, Frame, and Emotions remain an ordered **Song setup** group.
- Completed setup contracts to a compact, recoverable summary outside setup routes.
- Structure becomes a quieter **Song map** destination.
- Compose and Arrange become the prominent **Workbench** destinations.
- Export is separated as an outcome.
- The left sidebar can contract to a persistent icon rail.
- The right contextual inspector can hide completely and is restored by an edge chevron.

## Scope

### In scope

- Refactor `PhaseRail` information architecture and visual hierarchy.
- Add route-aware setup disclosure behavior and setup completion summaries.
- Add accessible icons and compact icon-only navigation.
- Add independent left-rail and right-inspector controls.
- Persist both sidebar preferences in browser storage.
- Allow the central workspace to consume the released width.
- Add focused unit and end-to-end coverage.

### Out of scope

- Workspace content, phrase blocks, arrangement editors, or inspector content.
- Changes to project data schema or creative workflow rules.
- Locking phases or turning free navigation into a wizard.

## Behavior

### Song setup disclosure

1. The disclosure is open while Story, Frame, or Emotions is active so the active route is always visible.
2. Outside setup routes, it defaults compact when all three setup areas contain meaningful content.
3. Story, Frame, and Emotions remain visible and directly navigable in compact mode; only their content summaries contract.
4. The setup header shows overall completion, and the user may expand or contract the summaries manually; the preference is remembered for the current project.
5. Navigation remains unrestricted.

### Left sidebar

1. Expanded width keeps labels, descriptions, creative compass, and grouped hierarchy.
2. Contracted width becomes an icon rail with one icon per destination, an active indicator, accessible names, and native title tooltips.
3. A boundary chevron toggles the width.
4. The preference is stored locally and reused across project workspaces.
5. Navigation groups keep their intrinsic height; on short windows the rail scrolls instead of compressing or clipping Song setup.

### Right inspector

1. A boundary chevron hides the inspector completely.
2. A persistent edge handle remains in the workspace when hidden.
3. The preference is independent of the left rail and stored locally.

## Accessibility

- Use native buttons for every disclosure and sidebar toggle.
- Provide `aria-expanded`, `aria-controls`, and explicit labels.
- Mark the current route with `aria-current="page"`.
- Keep icon-only destinations labelled for assistive technology and keyboard reachable.
- Preserve visible focus treatment and minimum 40–44px pointer targets where space allows.
- Do not use color alone for active or completed states.

## Implementation sequence

1. Add shell state and persisted preferences to `WorkspaceLayout`.
2. Expose the left contraction state to the rail through scoped slot props.
3. Refactor `PhaseRail` into setup, song map, workbench, and export groups.
4. Add a small reusable phase icon component.
5. Update responsive grid rules for expanded, contracted, and hidden states.
6. Add unit tests for completion and disclosure behavior.
7. Extend navigation end-to-end coverage for contraction, restoration, and state independence.
8. Run typecheck, unit tests, lint, build, and the focused browser tests.

## Acceptance criteria

- All seven destinations remain reachable in both left-rail states.
- Story, Frame, and Emotions appear in numeric order when Song setup is expanded.
- Story, Frame, and Emotions remain visibly sized at full and compact viewport heights.
- Compose and Arrange are visually primary in the expanded rail.
- Contracting the left rail never removes navigation.
- Hiding the right inspector removes its grid column and exposes a restore chevron.
- Left and right preferences work independently and survive route changes.
- The center workspace components are not modified.
- Existing phase-navigation behavior remains free rather than locked.
