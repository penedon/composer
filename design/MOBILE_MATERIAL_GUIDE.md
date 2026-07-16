# Composer mobile material and adaptive design guide

Status: mobile draft, implementation baseline  
Updated: 2026-07-16

## Product stance

Mobile Composer is the same songwriting system, not a reduced companion. Story, musical frame, emotions, structure, phrase composition, arrangement, and export remain available. The layout changes by window size while the canonical project and route model stay the same.

The visual direction remains **Studio Notebook**:

- warm paper is reserved for artist-authored writing and phrase content;
- the low-glare shell contains navigation, transport, structure, and editing tools;
- emotion color is always paired with a label, shape, value, or line identity;
- suggestions remain explainable, auditionable, and inert until accepted;
- the current musical state remains visible, but secondary context is disclosed on demand.

## Research baseline

The mobile draft follows current Material and accessibility guidance:

- Treat width as a dynamic window property, not a device label. Material classifies widths below 600 dp as compact, 600–839 dp as medium, and 840–1199 dp as expanded; layouts should continue to flex inside each class. [Android window size classes](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes)
- Use one content pane on compact and medium widths; supporting context may sit beside the main pane only when the window is expanded. [Adaptive app foundations](https://developer.android.com/develop/adaptive-apps/guides/get-started-with-adaptive-apps)
- Use a navigation bar for three to five consistent destinations on compact windows. [Material 3 navigation bar](https://developer.android.com/develop/ui/compose/components/navigation-bar)
- Use 16 dp compact margins and a four-column compact grid as layout guardrails, not fixed component widths. [Android content composition](https://developer.android.com/design/ui/mobile/guides/layout-and-content/content-structure)
- Use a bottom sheet for secondary anchored content. Composer applies this to project intent, featured emotions, and note properties. [Material bottom sheets](https://developer.android.com/develop/ui/compose/quick-guides/content/create-bottom-sheet)
- Provide 48 by 48 dp touch targets for primary touch controls. This exceeds WCAG 2.2 AA's 24 by 24 CSS pixel minimum and aligns with Android accessibility guidance. [Android touch targets](https://developer.android.com/codelabs/basic-android-kotlin-compose-test-accessibility), [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Reflow at 320 CSS px without losing information or functionality. Two-dimensional scrolling remains acceptable for interfaces whose meaning depends on a spatial canvas, such as the piano roll, provided the surrounding page does not also require horizontal scrolling. [WCAG 2.2 reflow](https://www.w3.org/TR/WCAG22/#reflow)
- Keep actions clear of system bars and gesture areas with safe-area insets. [Material 3 insets](https://developer.android.com/develop/ui/compose/system/material-insets)
- Every drag interaction needs a single-pointer alternative. Composer keeps tap-to-set values and explicit move/edit controls alongside curves, sections, and sequencer gestures. [WCAG 2.2 dragging movements](https://www.w3.org/TR/WCAG22/#dragging-movements)

## Adaptive shell

| Region | Compact, less than 600 px | Medium, 600–1099 px | Expanded, 1100 px and above |
| --- | --- | --- | --- |
| Project bar | 56 px top bar; title, undo, redo | desktop bar | desktop bar |
| Primary navigation | 5-item bottom bar | side rail | full/collapsible side rail |
| Supporting context | modal bottom sheet | hidden/on demand | persistent inspector |
| Transport | 56 px compact dock above navigation | persistent tracker + transport | persistent tracker + transport |
| Content | one pane, 16 px margins | one pane | main + supporting pane |

The five compact destinations are:

1. **Setup** — contains Story, Frame, and Emotions in a local three-step strip.
2. **Map** — Structure and emotional arc across song sections.
3. **Compose** — Phrase Workspace.
4. **Arrange** — tracks and sequence editors.
5. **Export** — project JSON and multitrack MIDI.

This grouping preserves all seven existing routes while keeping the compact navigation bar within Material's recommended three-to-five destination range.

## Compact tokens

| Token | Value | Use |
| --- | --- | --- |
| `--compact-margin` | `1rem` / 16 px | page edge and card alignment |
| `--touch-target` | `3rem` / 48 px | minimum interactive height and width |
| `--project-bar-height` | `3.5rem` / 56 px | compact top app bar |
| `--compact-transport-height` | `3.5rem` / 56 px | one-row playback dock |
| `--mobile-nav-height` | `4.5rem` / 72 px plus safe inset | five-item navigation |
| compact card radius | 16 px | paper and tonal containers |
| compact spacing rhythm | 4, 8, 12, 16, 24, 32 px | internal and section spacing |

Text must remain usable at 200% browser zoom. Body copy does not go below 14 px; navigation labels use 11–12 px with strong contrast and a 48 px or larger target.

## Flow translation

### Create and set intent

`Project library -> Story -> Frame -> Emotions -> Structure`

- Creating or opening a project lands in Story.
- Setup shows a local Story / Frame / Emotions step strip; it is navigation, not a locked wizard.
- The current phase owns the vertical scroll position.
- Primary actions appear after the content they affect; autosave status is announced without taking persistent mobile width.

### Shape and compose

`Structure -> Compose -> audition phrase -> keep or vary -> next phrase`

- Structure cards become a vertical list; the song section strip may scroll horizontally.
- A phrase is a single full-width paper card.
- Frequently used phrase actions remain visible; secondary actions move to overflow.
- The mobile equivalent of `Shift+Enter` is an explicit **Play & next** action while the keyboard shortcut remains available.

### Arrange

`Arrange -> choose track -> choose section -> edit sequence -> inspect note`

- Track controls stack vertically.
- The piano roll and drum grid keep intentional two-dimensional scrolling with sticky pitch/instrument labels.
- Tool modes use 48 px segmented controls.
- Selected-note properties open in the Context bottom sheet; every spatial edit also has numeric fields.

### Review and export

`Any phase -> Play song -> Export -> project JSON or multitrack MIDI`

- The compact transport remains available above primary navigation.
- The song tracker is summarized on compact screens and restored on medium/expanded windows.
- Export readiness and formats become one-column cards with explicit file outcomes.

## Component rules

- Use a top app bar for project identity and history actions, not phase navigation.
- Use the bottom navigation only for the five stable destination groups.
- Use horizontal scrolling only for meaningful time/section canvases and clearly clip the next item to signal overflow.
- Use bottom sheets for supporting context and long secondary action lists; trap focus while modal and return focus to the trigger on close.
- Never place the primary save/export action under the home indicator or software keyboard.
- Keep the currently playing state in text as well as icon shape; a square always means Stop and a triangle always means Play.
- Do not rely on hover for chord explanations, phrase tools, or sequencer state.
- Persist artist data immediately; transient sheet, scroll, and tool-mode state may remain local UI state.

## Verification matrix

Minimum acceptance viewports:

- 320 × 568: WCAG reflow floor.
- 390 × 844: representative compact portrait.
- 844 × 390: compact-height landscape; transport and navigation must not obscure the active editor.
- 768 × 1024: medium tablet portrait.
- 1440 × 900: expanded desktop regression.

At each size, verify free phase navigation, keyboard focus, 48 px primary touch targets, context-sheet focus/close behavior, visible playback state, no page-level horizontal overflow, and persistence after route changes.
