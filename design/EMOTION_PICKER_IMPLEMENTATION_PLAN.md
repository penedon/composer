# Semantic emotion picker implementation plan

## Outcome

Replace the featured-emotion family orbit with a semantic picker that makes major families, minor shades, and blended emotions visible in one map. Keep the dominant-family picker simple and preserve a linear route for compact screens and users who prefer lists.

## Guardrails

- Do not add presentation-only fields to `FeaturedEmotion` or change the saved project schema.
- Keep one canonical taxonomy. The wheel, list, details, tests, and stored selection must all resolve the same emotion IDs.
- Classify `shade` versus `blend` explicitly. Do not infer it from the currently selected family or from a numeric threshold at render time.
- Treat family weights as semantic composition, not percentages that must total 100. Existing values remain unchanged.
- Keep every emotion reachable without color, hover, dragging, or pointer precision.
- Use real HTML buttons over decorative SVG. Do not make SVG paths the only interactive controls.
- Preserve a list route and default to it on compact screens. Do not maintain a second mobile taxonomy.
- A featured emotion that is already used in another slot stays visible but unavailable; it must not silently disappear.
- Selection remains pending until explicit confirmation. Cancel must never mutate the project.
- Verify modal fit at desktop and compact sizes; the confirmation footer must remain visible.

## Architecture

1. `emotionTaxonomy.ts` remains the canonical persisted emotion data.
2. `emotionPresentation` is an exhaustive record keyed by `EmotionId` for stable UI classification and descriptions.
3. `EmotionSemanticWheel` renders:
   - eight fixed family sectors;
   - outer shade nodes;
   - inner blend nodes;
   - one connector per contributing family;
   - keyboard-operable radio buttons and reversible family filters.
4. `EmotionPicker` owns pending selection, wheel/list mode, weighted details, confirmation, and cancellation.
5. Existing `EmotionFamilyOrbit` and `EmotionNuanceList` provide the family-only flow and compact/list fallback.

## Delivery phases

- [x] Audit call sites, taxonomy, tests, persistence, and responsive behavior.
- [x] Add explicit, exhaustive presentation semantics without schema changes.
- [x] Implement the semantic wheel and weighted blend connections.
- [x] Integrate wheel/list modes and a selected-emotion detail panel.
- [x] Preserve the dominant-family picker and duplicate-selection behavior.
- [x] Add taxonomy, component, desktop journey, compact layout, and accessibility coverage.
- [x] Validate unit tests, typechecking, production build, browser behavior, and visual fit.
- [ ] Expand the taxonomy only after product review of vocabulary, family order, and placement.
- [ ] Consider intensity editing as a separate control; do not overload family weights with intensity.

## Acceptance criteria

- All canonical emotions are directly reachable in the wheel or list.
- A blend visibly connects to every family with a positive stored weight.
- Longing presents Love 70%, Sadness 60%, and Desire 50% without normalizing the values.
- Family filters highlight relationships without removing unrelated emotions.
- Arrow keys move between available emotion choices.
- Duplicate featured emotions are disabled and labeled.
- Compact screens open in list mode and do not create horizontal page overflow.
- The picker has no Axe accessibility violations in the focused browser journey.
- Unit tests and the production build pass.
