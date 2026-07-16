# Preview sample sources

Composer currently loads its sampled preview sounds through `smplr` 1.0.0.

## Pitched instruments

- Source: FluidR3_GM pre-rendered MIDI.js SoundFonts
- Upstream: https://github.com/gleitz/midi-js-soundfonts
- License: Creative Commons Attribution 3.0 for the FluidR3_GM sound bank; see the upstream repository for attribution and source details.
- Delivery: fetched on first use from `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/` by `smplr`.

## Drum machines

- Source: the `smpldsnds` drum-machine collection used by `smplr`
- Upstream: https://github.com/smpldsnds
- Delivery: fetched on first use from `https://smpldsnds.github.io/drum-machines/` by `smplr`.
- Selected machines: Roland CR-8000, LM-2, TR-808, and Casio RZ-1.

The remote delivery above is an explicit implementation limitation, tracked as BP-01 and BP-22 in `design/SAMPLER_PLAYBACK_IMPLEMENTATION_PLAN.md`. Do not vendor or redistribute the drum files until their source-specific redistribution terms have been recorded. The playback engine keeps its synthesized fallback so a failed fetch does not silence an arrangement.
