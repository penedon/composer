const NOTE_INDEX: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 }

export interface ChordAnalysis {
  symbol: string
  functionLabel: string
  plainLanguage: string
  tension: number
}

export function chordMidiNotes(symbol: string, octave = 4): number[] {
  const match = symbol.match(/^([A-G](?:#|b)?)(m|dim|aug)?(7)?/)
  if (!match) return [60, 64, 67]
  const rootName = match[1] ?? 'C'
  const root = (NOTE_INDEX[rootName] ?? 0) + (octave + 1) * 12
  const quality = match[2] ?? ''
  const intervals = quality === 'm' ? [0, 3, 7] : quality === 'dim' ? [0, 3, 6] : quality === 'aug' ? [0, 4, 8] : [0, 4, 7]
  if (match[3]) intervals.push(quality === 'm' ? 10 : 10)
  return intervals.map((interval) => root + interval)
}

export function analyzeChord(symbol: string, key: string): ChordAnalysis {
  const tonic = key.split(' ')[0] ?? 'C'
  const root = symbol.match(/^[A-G](?:#|b)?/)?.[0] ?? 'C'
  if (root === tonic) return { symbol, functionLabel: 'i · tonic', plainLanguage: 'Home — stable in the current key', tension: 18 }
  const dominantByTonic: Record<string, string> = { C: 'G', D: 'A', E: 'B', F: 'C', G: 'D', A: 'E', B: 'F#', Bb: 'F', Eb: 'Bb' }
  if (root === dominantByTonic[tonic]) return { symbol, functionLabel: 'V · dominant', plainLanguage: 'Strong pull toward home', tension: symbol.includes('7') ? 88 : 74 }
  return { symbol, functionLabel: 'color chord', plainLanguage: 'Departure — changes the harmonic color', tension: symbol.includes('dim') ? 92 : 48 }
}

export function suggestNextChords(current: string, key: string): ChordAnalysis[] {
  const candidates = key.startsWith('D') ? ['Dm', 'Bb', 'Gm', 'A7', 'C', 'F'] : ['C', 'Am', 'F', 'G7', 'Dm', 'Em']
  return candidates.filter((symbol) => symbol !== current).map((symbol) => analyzeChord(symbol, key))
}
