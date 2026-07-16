import type { TrackRole } from '@domain/project/project.types'

export interface InstrumentDescriptor {
  id: string
  label: string
  role: TrackRole
  family: 'keys' | 'guitar' | 'strings' | 'bass' | 'wind' | 'voice' | 'synth' | 'drums'
  defaultPreviewPitch: number
  drumMapId: string | null
}

export const instrumentCatalog: readonly InstrumentDescriptor[] = [
  { id: 'keys.soft-piano', label: 'Soft piano', role: 'harmony', family: 'keys', defaultPreviewPitch: 60, drumMapId: null },
  { id: 'keys.electric-piano', label: 'Electric piano', role: 'harmony', family: 'keys', defaultPreviewPitch: 60, drumMapId: null },
  { id: 'guitar.nylon', label: 'Nylon guitar', role: 'harmony', family: 'guitar', defaultPreviewPitch: 60, drumMapId: null },
  { id: 'strings.warm-ensemble', label: 'Warm strings', role: 'harmony', family: 'strings', defaultPreviewPitch: 60, drumMapId: null },
  { id: 'bass.upright', label: 'Upright bass', role: 'bass', family: 'bass', defaultPreviewPitch: 40, drumMapId: null },
  { id: 'bass.electric', label: 'Electric bass', role: 'bass', family: 'bass', defaultPreviewPitch: 40, drumMapId: null },
  { id: 'bass.synth', label: 'Synth bass', role: 'bass', family: 'synth', defaultPreviewPitch: 40, drumMapId: null },
  { id: 'strings.cello', label: 'Cello', role: 'bass', family: 'strings', defaultPreviewPitch: 48, drumMapId: null },
  { id: 'kit.brush', label: 'Brush kit', role: 'rhythm', family: 'drums', defaultPreviewPitch: 38, drumMapId: 'gm-standard' },
  { id: 'kit.acoustic', label: 'Acoustic kit', role: 'rhythm', family: 'drums', defaultPreviewPitch: 36, drumMapId: 'gm-standard' },
  { id: 'kit.electronic', label: 'Electronic kit', role: 'rhythm', family: 'drums', defaultPreviewPitch: 36, drumMapId: 'gm-standard' },
  { id: 'kit.hand-percussion', label: 'Hand percussion', role: 'rhythm', family: 'drums', defaultPreviewPitch: 38, drumMapId: 'gm-standard' },
  { id: 'voice.guide', label: 'Voice', role: 'melody', family: 'voice', defaultPreviewPitch: 69, drumMapId: null },
  { id: 'guitar.electric-clean', label: 'Electric guitar', role: 'melody', family: 'guitar', defaultPreviewPitch: 64, drumMapId: null },
  { id: 'wind.flute', label: 'Flute', role: 'melody', family: 'wind', defaultPreviewPitch: 72, drumMapId: null },
  { id: 'synth.lead', label: 'Synth lead', role: 'melody', family: 'synth', defaultPreviewPitch: 69, drumMapId: null },
] as const

const byId = new Map(instrumentCatalog.map((instrument) => [instrument.id, instrument]))
const legacyLabels = new Map(instrumentCatalog.flatMap((instrument) => [
  [instrument.label.toLowerCase(), instrument.id] as const,
]))

legacyLabels.set('electric guitar (clean)', 'guitar.electric-clean')
legacyLabels.set('synth lead', 'synth.lead')

export const defaultInstrumentId: Record<TrackRole, string> = {
  harmony: 'keys.soft-piano',
  bass: 'bass.upright',
  rhythm: 'kit.brush',
  melody: 'voice.guide',
}

export function instrumentsForRole(role: TrackRole): readonly InstrumentDescriptor[] {
  return instrumentCatalog.filter((instrument) => instrument.role === role)
}

export function instrumentById(id: string): InstrumentDescriptor | null {
  return byId.get(id) ?? null
}

export function instrumentLabel(id: string): string {
  const descriptor = instrumentById(id)
  if (descriptor) return descriptor.label
  if (id.startsWith('legacy:')) {
    try { return `${decodeURIComponent(id.slice(7))} (unavailable)` } catch { /* malformed legacy ID */ }
  }
  return `${id} (unavailable)`
}

export function migrateInstrumentId(value: string, role: TrackRole): string {
  const normalized = value.trim()
  if (!normalized) return defaultInstrumentId[role]
  if (byId.has(normalized)) return normalized
  return legacyLabels.get(normalized.toLowerCase()) ?? `legacy:${encodeURIComponent(normalized)}`
}

export interface ImportedMidiInstrument {
  number?: number
  name?: string
  family?: string
  percussion?: boolean
}

export function instrumentIdForImportedMidi(role: TrackRole, source: ImportedMidiInstrument): string {
  if (source.percussion || role === 'rhythm') return 'kit.acoustic'

  const label = `${source.name ?? ''} ${source.family ?? ''}`.toLowerCase()
  if (/electric guitar|clean guitar|distortion guitar|overdriven guitar/.test(label)) return 'guitar.electric-clean'
  if (/nylon|acoustic guitar/.test(label)) return role === 'melody' ? 'guitar.electric-clean' : 'guitar.nylon'
  if (/synth bass/.test(label)) return 'bass.synth'

  const program = source.number
  if (typeof program === 'number') {
    if (program <= 7) return role === 'harmony' ? (program >= 4 ? 'keys.electric-piano' : 'keys.soft-piano') : defaultInstrumentId[role]
    if (program >= 24 && program <= 31) return role === 'melody' ? 'guitar.electric-clean' : 'guitar.nylon'
    if (program >= 32 && program <= 39) return program === 32 ? 'bass.upright' : program >= 38 ? 'bass.synth' : 'bass.electric'
    if (program >= 40 && program <= 47) return role === 'bass' ? 'strings.cello' : 'strings.warm-ensemble'
    if (program >= 52 && program <= 54) return 'voice.guide'
    if (program >= 72 && program <= 79) return 'wind.flute'
    if (program >= 80 && program <= 87) return 'synth.lead'
  }

  if (/bass/.test(label)) return /synth/.test(label) ? 'bass.synth' : /acoustic|upright/.test(label) ? 'bass.upright' : 'bass.electric'
  if (/guitar/.test(label)) return /nylon|acoustic/.test(label) && role === 'harmony' ? 'guitar.nylon' : 'guitar.electric-clean'
  if (/piano|keyboard|organ/.test(label)) return /electric/.test(label) ? 'keys.electric-piano' : 'keys.soft-piano'
  if (/cello/.test(label)) return 'strings.cello'
  if (/string/.test(label)) return 'strings.warm-ensemble'
  if (/flute|wind|whistle/.test(label)) return 'wind.flute'
  if (/voice|vocal|choir/.test(label)) return 'voice.guide'
  if (/lead|synth/.test(label)) return role === 'bass' ? 'bass.synth' : 'synth.lead'
  return defaultInstrumentId[role]
}
