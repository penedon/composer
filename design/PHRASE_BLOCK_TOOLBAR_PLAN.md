# Compose phrase-block toolbar implementation plan

## Approved direction

Keep lyrics and chords visually dominant. Retain an explicit primary Play action on the selected phrase, represent frequent supporting actions with icons and descriptive tooltips, and move structural edits into one overflow menu.

Reference: [`screens/21-compose-phrase-block-toolbar.svg`](./screens/21-compose-phrase-block-toolbar.svg)

## Control hierarchy

- **Primary:** Play phrase uses a distinct dark icon control with its label in a hover/focus tooltip.
- **Frequent supporting actions:** Play with lead-in, Loop, Save alternative, and Chord possibilities become 42px icon controls.
- **Structural actions:** Move earlier, Move later, Split, Merge with next, and Remove phrase move into a More actions menu.
- **Inactive phrases:** Keep only the Play and More actions icons visible until the phrase is selected.

## Interaction and accessibility

- Every icon button has an explicit accessible name.
- Descriptive tooltips appear on both pointer hover and keyboard focus.
- The overflow trigger exposes `aria-haspopup`, `aria-expanded`, and `aria-controls`.
- The menu uses menu/menuitem semantics, closes after a command, and closes with Escape or a click elsewhere in the phrase.
- Existing emitted commands and canonical project operations remain unchanged.
- Focus rings and minimum 42px pointer targets are preserved.

## Responsive behavior

- Keep Play, frequent icons, and More actions in one wrapping toolbar.
- Move the keyboard shortcut hint to its own row when horizontal space is limited.
- Allow tooltips and the overflow menu to layer above adjacent phrase content.

## Playback reactivity

- Publish a live phrase-local beat while a phrase is playing.
- Project the global song beat into the current phrase during full-song playback.
- Follow the currently playing section and phrase while Compose is open.
- Highlight exactly one chord when the local beat falls within that chord event’s beat and duration; show no highlight during gaps or unwritten bars.
- Expose the sounding chord with `aria-current` in addition to its visual treatment.

## Verification

- Update phrase-block unit tests to exercise the icon controls by accessible name.
- Add tests for opening, invoking, and dismissing the structural menu.
- Add end-to-end tests confirming toolbar behavior and chord highlighting during phrase and full-song playback.
- Run type checking, focused lint, unit tests, two-browser e2e tests, production build, and footer/phrase accessibility checks.
