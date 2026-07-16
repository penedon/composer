# Emotion Picker Project Plan

Status: Proposed  
Design reference: [`screens/09-emotion-picker-before-after.svg`](screens/09-emotion-picker-before-after.svg)  
Primary workspace: `src/main/presentation/workspaces/EmotionWorkspace`

## 1. Objective

Replace the flat native emotion selects with a family-first picker that makes the existing taxonomy visible and understandable.

The interaction should help a composer:

1. recognize the eight stable emotion families;
2. browse precise emotions within a family;
3. understand when an emotion blends multiple families;
4. compare candidates without repeatedly opening select menus;
5. confirm a change before it affects the emotional arc and linked phrases.

The implementation must follow Composer's Studio Notebook visual language and remain fully usable with keyboard navigation, screen readers, reduced motion, and narrow viewports.

## 2. Success criteria

- All eight emotion families are visible in one stable map.
- Every item in `emotionTaxonomy` is reachable from at least one family.
- Core emotions and blended emotions are visibly distinguished with text, not color alone.
- The current selection, destination slot, and pending replacement stay visible until confirmation.
- Replacing a featured emotion still preserves existing intensity points and updates linked phrase emotion IDs.
- An emotion already used in another featured slot cannot be selected again.
- A keyboard user can open, browse, select, confirm, and dismiss the picker without focus loss.
- At widths where a circle becomes cramped, the family control becomes a labeled grid while preserving the same DOM order.
- Unit, component, integration, accessibility, and visual regression tests pass.

## 3. Scope

### In scope

- Family metadata and taxonomy grouping helpers.
- A reusable modal emotion picker for replacing any of the three featured emotions.
- A family-only mode for changing the dominant family with the same family control.
- Family orbit, narrow-screen family grid, nuance list, blend labels, selection preview, and confirmation actions.
- Integration with `EmotionWorkspace.vue` and existing project operations.
- Keyboard, focus, screen-reader, reduced-motion, and responsive behavior.
- Automated tests and updated emotion-workspace snapshots.

### Out of scope

- Adding or editing taxonomy entries.
- Custom user-authored emotions.
- Changing the saved project schema or schema version.
- Changing emotion-curve editing behavior.
- Automatically changing harmony, lyrics, or arrangement from an emotion choice.
- Replacing the full Emotional Arc Builder design.

## 4. Product behavior

### Featured-emotion flow

1. The user activates **Change** on a featured-emotion card.
2. The picker opens with the slot's current primary family selected.
3. The user moves through the family orbit or family grid.
4. The nuance panel shows:
   - **Core shades**: the selected family has the emotion's strongest weight and no secondary weight is `0.3` or greater;
   - **Blended shades**: the selected family contributes to the emotion, but the emotion has another substantial family influence.
5. Used emotions remain visible but disabled and labeled **Already featured**.
6. Selecting a nuance updates a pending preview only.
7. **Use emotion** calls `replaceFeaturedEmotion` and closes the picker.
8. **Cancel**, `Escape`, or the close button discards the pending selection.

### Dominant-family flow

1. The user activates the dominant-family control.
2. The picker opens in family-only mode.
3. Selecting a family updates the pending preview.
4. **Use family** calls `setDominantEmotionFamily` and closes the picker.

Changing the dominant family must not silently replace any featured emotion. Replacing a featured emotion must not silently change the dominant family.

### Initial-family rule

For a featured slot, select the current emotion's highest-weight family. If two families have equal weight, prefer the project's dominant family; otherwise use the canonical `emotionFamilies` order.

## 5. Technical approach

### Persisted model

No migration is required. Continue using:

- `EmotionPlan.dominantFamily`;
- `EmotionPlan.featured`;
- `FeaturedEmotion.families`;
- `replaceFeaturedEmotion`;
- `setDominantEmotionFamily`.

The existing replacement operation remains the single mutation path because it already:

- rejects duplicate featured emotions;
- transfers emotion-curve points to the replacement ID;
- updates phrases linked to the previous emotion;
- records the project as changed through the store mutation wrapper.

### Taxonomy presentation model

Add semantic family presentation metadata beside the taxonomy:

```ts
interface EmotionFamilyPresentation {
  id: EmotionFamily
  label: string
  color: string
  shortDescription: string
}
```

Add pure functions to:

- determine an emotion's primary family;
- return every emotion influenced by a selected family;
- classify an option as core or blended;
- sort by selected-family weight, then name;
- produce accessible blend text such as `Love + sadness + desire`.

Keep these functions independent of Vue and the project store so they can be unit tested directly.

### Component structure

```text
src/main/presentation/components/emotion/
├── EmotionPicker/
│   ├── EmotionPicker.vue
│   ├── EmotionPicker.scss
│   └── EmotionPicker.types.ts
├── EmotionFamilyOrbit/
│   ├── EmotionFamilyOrbit.vue
│   └── EmotionFamilyOrbit.scss
└── EmotionNuanceList/
    ├── EmotionNuanceList.vue
    └── EmotionNuanceList.scss

src/tests/unit/presentation/components/emotion/
├── EmotionPicker.spec.ts
├── EmotionFamilyOrbit.spec.ts
└── EmotionNuanceList.spec.ts
```

Responsibilities:

- `EmotionPicker`: dialog lifecycle, pending state, preview, confirm/cancel, mode selection, and focus restoration.
- `EmotionFamilyOrbit`: family selection only; renders an orbit at wide widths and a grid at narrow widths.
- `EmotionNuanceList`: core/blended grouping, disabled-used states, and pending nuance selection.
- `EmotionWorkspace`: supplies current project state and performs confirmed store mutations.

### Dialog behavior

Use the native `<dialog>` element with `showModal()` when supported by the target WebView. Verify Tauri's minimum WebView support before merging. The component must:

- have an accessible name and description;
- move focus to the selected family or first enabled control on open;
- keep focus inside while modal;
- close on `Escape` without committing;
- restore focus to the invoking button;
- prevent background interaction;
- expose a visible close button in addition to `Escape`.

If the supported Tauri WebView cannot provide reliable native-dialog behavior, use the same public component API with an application dialog shell and explicit focus containment.

### Orbit implementation

- Keep the eight families in canonical domain order.
- Render the visual sectors in inline SVG.
- Place real HTML buttons over the sectors so browser focus, labels, and activation behavior remain native.
- Use roving `tabindex`: one tab stop enters the family control; arrow keys move clockwise or counterclockwise; `Home` and `End` jump to bounds; `Enter` or `Space` selects.
- Pair every color with a visible family name and selected outline.
- Avoid animated rotation. A short opacity/outline transition is sufficient and must be disabled under `prefers-reduced-motion`.
- Below the responsive breakpoint, replace orbit positioning with a two-column button grid without changing DOM or keyboard order.

## 6. Work breakdown

### Milestone 1 — Behavior contract and taxonomy helpers

Effort: Small

- Add family labels, colors, and short descriptions.
- Implement primary-family, grouping, blend classification, and sorting helpers.
- Add unit tests covering all 18 current taxonomy entries.
- Assert that every taxonomy emotion appears in at least one family result.

Exit criteria:

- Grouping rules are deterministic and documented by tests.
- No project schema or fixture changes are required.

### Milestone 2 — Family and nuance controls

Effort: Medium

- Build `EmotionFamilyOrbit` with orbit and responsive grid layouts.
- Build `EmotionNuanceList` with core, blended, selected, and disabled states.
- Add component tests for pointer and keyboard selection.
- Verify contrast and non-color indicators against the existing design tokens.

Exit criteria:

- Both components work independently in test fixtures.
- All families and emotions are readable at `1280 × 800` and narrow layouts.

### Milestone 3 — Modal picker composition

Effort: Medium

- Compose the family and nuance controls inside `EmotionPicker`.
- Add featured-emotion and family-only modes.
- Implement pending selection, preview, confirm, cancel, close, and focus restoration.
- Mark already-featured emotions as disabled with an explanatory label.
- Add accessible status announcements when the family or pending emotion changes.

Exit criteria:

- No project state changes before confirmation.
- Canceling always leaves the project untouched.
- The entire dialog flow works without a pointer.

### Milestone 4 — Emotion workspace integration

Effort: Small

- Replace the dominant-family `<select>` with a labeled button that opens family-only mode.
- Replace each featured card `<select>` with a **Change** button.
- Keep the current featured cards, semantic dots, family labels, and curve immediately visible.
- Route confirmed changes through the existing store mutations and domain operations.
- Preserve existing operation descriptions or make them more specific without changing mutation semantics.

Exit criteria:

- Dominant-family and featured-emotion changes save correctly.
- Curve intensities and linked phrase emotion IDs survive replacement.
- Duplicate featured selections remain impossible.

### Milestone 5 — Accessibility and responsive hardening

Effort: Medium

- Test keyboard order, arrow navigation, `Escape`, focus containment, and focus return.
- Add live-region copy that is concise and does not announce visual decoration.
- Verify zoom at 200%, minimum supported width, and `1280 × 800` desktop layout.
- Verify forced-colors behavior and reduced-motion behavior.
- Run Axe against the open and closed picker states.

Exit criteria:

- No serious or critical Axe violations.
- Every action has a visible focus state and text alternative.
- Content does not clip or require two-dimensional scrolling.

### Milestone 6 — Regression coverage and rollout

Effort: Small

- Extend project-operation tests for replacement cascades if current coverage is incomplete.
- Add an integration test for open → browse → select → confirm → persist.
- Add an integration test for cancel and duplicate prevention.
- Update Chromium and WebKit emotion-workspace visual snapshots.
- Run typecheck, lint, unit/integration tests, E2E tests, and production build.
- Perform a manual Tauri smoke test before release.

Exit criteria:

- CI is green.
- Snapshot changes are limited to the intended emotion-workspace UI.
- The picker works in the packaged desktop application.

## 7. Test matrix

| Layer | Required coverage |
|---|---|
| Domain/pure functions | Primary family, ties, grouping, blends, sorting, complete taxonomy reachability |
| Component | Pointer selection, roving focus, arrow keys, grid fallback, disabled options, preview state |
| Workspace integration | Dominant family mutation, featured replacement, cancel, duplicate rejection |
| Data integrity | Point IDs transferred, phrase emotion IDs transferred, intensities unchanged |
| Accessibility | Dialog name, focus containment/return, Axe, live updates, reduced motion, forced colors |
| Visual | Default, selected family, selected nuance, disabled-used emotion, narrow viewport |
| Desktop smoke | Open/close and persistence in the packaged Tauri app |

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The orbit becomes decorative rather than usable | Keep selection controls as semantic HTML buttons and provide the responsive grid form. |
| Multi-family emotions appear in surprising places | Show them under every contributing family, clearly label blends, and use deterministic sorting. |
| Color contrast varies across family colors | Use color as an accent only; keep text on stable surfaces and add outlines, checks, and labels. |
| Dialog behavior differs in the desktop WebView | Validate native `<dialog>` early and retain a replaceable dialog-shell boundary. |
| Replacing an emotion damages downstream data | Keep `replaceFeaturedEmotion` as the only confirmed mutation path and add explicit cascade tests. |
| The picker overwhelms beginners | Show one selected family and one readable nuance panel at a time; avoid the reference wheel's dense outer rings. |

## 9. Delivery sequence

Recommended pull-request sequence:

1. **Taxonomy presentation model and tests** — no visible UI change.
2. **Family orbit and nuance-list components** — isolated component coverage.
3. **Picker dialog and accessibility behavior** — still not wired into project mutation.
4. **Emotion workspace integration** — replaces the native selects.
5. **Visual snapshots, desktop smoke test, and cleanup**.

This sequence keeps domain behavior reviewable, makes accessibility testable before integration, and limits the final workspace change to wiring and styling.

## 10. Definition of done

- The before/after interaction shown in the design reference is represented in the running application.
- All existing emotion data remains compatible without migration.
- All taxonomy items are reachable and correctly labeled.
- Confirm, cancel, duplicate, keyboard, screen-reader, reduced-motion, and responsive states are tested.
- The production build and packaged desktop smoke test pass.
- The old native family and featured-emotion selects are removed from `EmotionWorkspace`.
- Implementation notes and any grouping-rule changes are reflected in this plan and the relevant tests.
