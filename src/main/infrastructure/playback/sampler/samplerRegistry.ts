export interface SamplerPresetDescriptor {
  kind: 'soundfont' | 'drum-machine'
  preset: string
}

const samplerRegistry: Readonly<Record<string, SamplerPresetDescriptor>> = {
  'keys.soft-piano': { kind: 'soundfont', preset: 'acoustic_grand_piano' },
  'keys.electric-piano': { kind: 'soundfont', preset: 'electric_piano_1' },
  'guitar.nylon': { kind: 'soundfont', preset: 'acoustic_guitar_nylon' },
  'strings.warm-ensemble': { kind: 'soundfont', preset: 'string_ensemble_1' },
  'bass.upright': { kind: 'soundfont', preset: 'acoustic_bass' },
  'bass.electric': { kind: 'soundfont', preset: 'electric_bass_finger' },
  'bass.synth': { kind: 'soundfont', preset: 'synth_bass_1' },
  'strings.cello': { kind: 'soundfont', preset: 'cello' },
  'kit.brush': { kind: 'drum-machine', preset: 'Roland CR-8000' },
  'kit.acoustic': { kind: 'drum-machine', preset: 'LM-2' },
  'kit.electronic': { kind: 'drum-machine', preset: 'TR-808' },
  'kit.hand-percussion': { kind: 'drum-machine', preset: 'Casio-RZ1' },
  'voice.guide': { kind: 'soundfont', preset: 'voice_oohs' },
  'guitar.electric-clean': { kind: 'soundfont', preset: 'electric_guitar_clean' },
  'wind.flute': { kind: 'soundfont', preset: 'flute' },
  'synth.lead': { kind: 'soundfont', preset: 'lead_2_sawtooth' },
}

export function samplerPresetFor(instrumentId: string): SamplerPresetDescriptor | null {
  return samplerRegistry[instrumentId] ?? null
}

export function registeredSamplerIds(): string[] {
  return Object.keys(samplerRegistry)
}
