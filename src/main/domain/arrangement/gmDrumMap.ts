export interface DrumMapPiece {
  pitch: number
  name: string
  shortName: string
}

export const gmDrumMap: readonly DrumMapPiece[] = [
  { pitch: 51, name: 'Ride bell', shortName: 'Ride' },
  { pitch: 49, name: 'Crash', shortName: 'Crash' },
  { pitch: 46, name: 'Open hat', shortName: 'Open HH' },
  { pitch: 42, name: 'Closed hat', shortName: 'Closed HH' },
  { pitch: 38, name: 'Snare', shortName: 'Snare' },
  { pitch: 37, name: 'Side stick', shortName: 'Stick' },
  { pitch: 45, name: 'Low tom', shortName: 'Low tom' },
  { pitch: 36, name: 'Kick', shortName: 'Kick' },
] as const
