import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import ToneMidi from '@tonejs/midi'
import type { Midi as MidiFile } from '@tonejs/midi'

import type { SongExample } from '../src/main/domain/examples/example.types'
import { instrumentIdForImportedMidi } from '../src/main/domain/arrangement/instrumentCatalog'
import type { ArrangementTrack, ChordEvent, CompositionProject, EmotionFamily, MidiNoteEvent, Phrase, SequenceClip, SongSection, TrackRole } from '../src/main/domain/project/project.types'

interface LicensedReferenceSpec {
  id: string
  artist: string
  title: string
  lyricsPath: string
  midiPath: string
  sectionStartBeats?: number[]
  trackNames?: string[]
}

interface LyricGroup {
  heading: string | null
  lines: string[]
}

interface SectionRange {
  section: SongSection
  startBeat: number
  endBeat: number
}

const timestamp = '2026-07-16T12:00:00.000Z'
const beatsPerBar = 4
const { Midi } = ToneMidi

const licensedReferences: LicensedReferenceSpec[] = [{
  id: 'scorpions-wind-of-change',
  artist: 'Scorpions',
  title: 'Wind of Change',
  lyricsPath: 'test-assets/licensed-reference-songs/scorpions-wind-of-change/lyrics.txt',
  midiPath: 'test-assets/licensed-reference-songs/scorpions-wind-of-change/song.mid',
  // Aligned to the supplied 5:11 karaoke MIDI: intro, verses, choruses, bridge, solo, and outro.
  sectionStartBeats: [0, 32, 92, 128, 164, 200, 224, 272, 312, 360],
  // @tonejs/midi splits the format-1 file by channel and loses most source track-name events.
  trackNames: ['Polysynth', 'Fretless Bass', 'Acoustic Guitar', 'Melody voice', 'Bright Acoustic Piano', 'Whistle', 'Electric Guitar', 'Overdriven Guitar', 'Distortion Guitar', 'Drums', 'Halo'],
}]

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'
}

function uniqueId(base: string, occupied: Set<string>): string {
  let id = base
  let suffix = 2
  while (occupied.has(id)) id = `${base}-${suffix++}`
  occupied.add(id)
  return id
}

function parseLyrics(text: string): LyricGroup[] {
  const groups: LyricGroup[] = []
  let current: LyricGroup = { heading: null, lines: [] }

  for (const rawLine of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = line.match(/^\[([^\]]+)]$/)?.[1]?.trim()
    if (heading) {
      if (current.lines.length || current.heading) groups.push(current)
      current = { heading, lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.length || current.heading) groups.push(current)
  return groups
}

function sectionRanges(midi: MidiFile, lyricGroups: LyricGroup[], sectionStartBeats?: number[]): SectionRange[] {
  const durationBeats = Math.max(beatsPerBar, midi.durationTicks / midi.header.ppq)
  const totalBars = Math.max(1, Math.ceil(durationBeats / beatsPerBar))
  const markers = midi.header.meta
    .filter((event) => event.type === 'marker' || event.type === 'cuePoint')
    .map((event) => ({ name: event.text.trim(), bar: Math.round(event.ticks / midi.header.ppq / beatsPerBar) }))
    .filter((event) => event.name && event.bar >= 0 && event.bar < totalBars)
    .sort((left, right) => left.bar - right.bar)
    .filter((event, index, all) => index === 0 || event.bar !== all[index - 1]?.bar)

  const headings = lyricGroups.map((group) => group.heading).filter((heading): heading is string => Boolean(heading))
  const suppliedBoundaries = sectionStartBeats?.length === headings.length
    ? headings.map((name, index) => ({ name, bar: Math.round((sectionStartBeats[index] ?? 0) / beatsPerBar) }))
    : null
  const boundaries = markers.length
    ? markers
    : suppliedBoundaries
      ? suppliedBoundaries
      : headings.length > 1
        ? headings.map((name, index) => ({ name, bar: Math.round(index * totalBars / headings.length) }))
        : [{ name: 'Complete song', bar: 0 }]

  if (boundaries[0]?.bar !== 0) boundaries.unshift({ name: 'Intro', bar: 0 })
  const occupied = new Set<string>()
  return boundaries.map((boundary, index) => {
    const nextBar = boundaries[index + 1]?.bar ?? totalBars
    const startBar = boundary.bar
    const bars = Math.max(1, nextBar - startBar)
    const id = uniqueId(slug(boundary.name), occupied)
    return {
      section: {
        id,
        name: boundary.name,
        bars,
        color: ['#536a78', '#765b68', '#75694f', '#53675d'][index % 4] ?? '#536a78',
        narrativePurpose: index === 0
          ? 'Establish the musical world and the possibility of change.'
          : index === boundaries.length - 1
            ? 'Resolve the accumulated tension in a hopeful, communal release.'
            : 'Develop the contrast between memory, uncertainty, and hope.',
        sourceSectionId: null,
      },
      startBeat: startBar * beatsPerBar,
      endBeat: (startBar + bars) * beatsPerBar,
    }
  })
}

function roleForTrack(name: string, family: string, percussion: boolean): TrackRole {
  const label = `${name} ${family}`.toLowerCase()
  if (percussion || /drum|percussion|kit/.test(label)) return 'rhythm'
  if (/bass/.test(label)) return 'bass'
  if (/lead|vocal|voice|whistle|melody|solo/.test(label)) return 'melody'
  return 'harmony'
}

function tracksAndClips(midi: MidiFile, ranges: SectionRange[], trackNames?: string[]): { tracks: ArrangementTrack[]; clips: SequenceClip[] } {
  const tracks: ArrangementTrack[] = []
  const clips: SequenceClip[] = []
  const occupied = new Set<string>()

  midi.tracks.filter((track) => track.notes.length > 0).forEach((midiTrack, trackIndex) => {
    const name = trackNames?.[trackIndex] ?? (midiTrack.name.trim() || midiTrack.instrument.name || `MIDI track ${trackIndex + 1}`)
    const trackId = `track-${uniqueId(slug(name), occupied)}`
    tracks.push({
      id: trackId,
      name,
      role: roleForTrack(name, midiTrack.instrument.family, midiTrack.instrument.percussion),
      instrumentId: instrumentIdForImportedMidi(roleForTrack(name, midiTrack.instrument.family, midiTrack.instrument.percussion), {
        number: midiTrack.instrument.number,
        name: midiTrack.instrument.name,
        family: midiTrack.instrument.family,
        percussion: midiTrack.instrument.percussion,
      }),
      volume: .78,
      muted: false,
      solo: false,
    })

    for (const range of ranges) {
      const notes: MidiNoteEvent[] = midiTrack.notes
        .filter((note) => {
          const beat = note.ticks / midi.header.ppq
          return beat >= range.startBeat && beat < range.endBeat
        })
        .map((note, noteIndex) => ({
          id: `${trackId}-${range.section.id}-note-${noteIndex + 1}`,
          pitch: note.midi,
          startBeat: note.ticks / midi.header.ppq - range.startBeat,
          durationBeats: Math.max(1 / 128, note.durationTicks / midi.header.ppq),
          velocity: Math.max(1, Math.min(127, Math.round(note.velocity * 127))),
        }))
      clips.push({ id: `sequence-${trackId}-${range.section.id}`, trackId, sectionId: range.section.id, sourceClipId: null, notes })
    }
  })
  return { tracks, clips }
}

function normalizedHeading(value: string | null): string {
  return slug(value ?? '').replace(/-\d+$/, '')
}

function distributeLyrics(lines: string[], bars: number): Array<{ lyrics: string; bars: number }> {
  if (!lines.length) return [{ lyrics: '', bars }]
  const phraseCount = Math.min(lines.length, bars)
  const groupedLines = Array.from({ length: phraseCount }, () => [] as string[])
  lines.forEach((line, index) => groupedLines[Math.floor(index * phraseCount / lines.length)]?.push(line))
  const baseBars = Math.floor(bars / phraseCount)
  const remainder = bars % phraseCount
  return groupedLines.map((group, index) => ({ lyrics: group.join('\n'), bars: baseBars + (index < remainder ? 1 : 0) }))
}

function phrasesForLyrics(groups: LyricGroup[], ranges: SectionRange[]): Phrase[] {
  const unmatched = [...groups]
  const phrases: Phrase[] = []

  ranges.forEach((range, rangeIndex) => {
    const exactHeading = slug(range.section.name)
    const sectionHeading = normalizedHeading(range.section.name)
    const exactMatch = unmatched.find((group) => group.heading && slug(group.heading) === exactHeading)
    const relaxedMatch = unmatched.find((group) => group.heading && normalizedHeading(group.heading) === sectionHeading)
    let matching = exactMatch ? [exactMatch] : relaxedMatch ? [relaxedMatch] : []
    if (!matching.length && ranges.length === 1) matching = unmatched
    if (!matching.length && groups.length === ranges.length && unmatched[0]) matching = [unmatched[0]]

    const lines = matching.flatMap((group) => group.lines)
    matching.forEach((group) => unmatched.splice(unmatched.indexOf(group), 1))
    const phraseDrafts = distributeLyrics(lines, range.section.bars)
    phraseDrafts.forEach(({ lyrics, bars }, order) => phrases.push({
      id: `phrase-${range.section.id}-${order + 1}`,
      sectionId: range.section.id,
      order,
      bars,
      lyrics,
      chords: [],
      emotionId: rangeIndex < ranges.length / 3 ? 'nostalgia' : rangeIndex < ranges.length * 2 / 3 ? 'yearning' : 'hope',
      rhythm: 'Imported lyric line',
      dynamics: 'From reference arrangement',
      instrumental: /intro|solo|outro/i.test(range.section.name),
    }))
  })

  if (unmatched.length && ranges[0]) {
    const sectionId = ranges[0].section.id
    const existing = phrases.filter((phrase) => phrase.sectionId === sectionId).length
    unmatched.flatMap((group) => group.lines).forEach((lyrics, index) => phrases.push({
      id: `phrase-${sectionId}-unmatched-${index + 1}`,
      sectionId,
      order: existing + index,
      bars: 1,
      lyrics,
      chords: [],
      emotionId: 'nostalgia',
      rhythm: 'Imported lyric line',
      dynamics: 'From reference arrangement',
      instrumental: false,
    }))
  }
  return phrases
}

interface ChordCandidate {
  symbol: string
  root: number
  tones: number[]
}

const pitchClassNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

function chordCandidates(): ChordCandidate[] {
  return pitchClassNames.flatMap((rootName, root) => [
    { symbol: rootName, root, tones: [root, (root + 4) % 12, (root + 7) % 12] },
    { symbol: `${rootName}m`, root, tones: [root, (root + 3) % 12, (root + 7) % 12] },
    { symbol: `${rootName}dim`, root, tones: [root, (root + 3) % 12, (root + 6) % 12] },
  ])
}

function inferChord(midi: MidiFile, startBeat: number, endBeat: number, trackNames?: string[]): string | null {
  const weights = Array.from({ length: 12 }, () => 0)
  const bassWeights = Array.from({ length: 12 }, () => 0)

  midi.tracks.filter((track) => track.notes.length > 0).forEach((track, trackIndex) => {
    const name = trackNames?.[trackIndex] ?? (track.name || track.instrument.name)
    const role = roleForTrack(name, track.instrument.family, track.instrument.percussion)
    if (role === 'rhythm') return
    const roleWeight = role === 'melody' ? .38 : role === 'bass' ? .75 : 1

    track.notes.forEach((note) => {
      const noteStart = note.ticks / midi.header.ppq
      const noteEnd = noteStart + note.durationTicks / midi.header.ppq
      const overlap = Math.min(endBeat, noteEnd) - Math.max(startBeat, noteStart)
      if (overlap <= 0) return
      const pitchClass = note.midi % 12
      const weight = overlap * (.5 + note.velocity)
      weights[pitchClass] = (weights[pitchClass] ?? 0) + weight * roleWeight
      if (role === 'bass') bassWeights[pitchClass] = (bassWeights[pitchClass] ?? 0) + weight
    })
  })

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  if (totalWeight === 0) return null

  return chordCandidates().map((candidate) => {
    const chordWeight = candidate.tones.reduce((sum, tone, index) => sum + (weights[tone] ?? 0) * (index === 0 ? 1.2 : 1), 0)
    const outsideWeight = weights.reduce((sum, weight, pitchClass) => sum + (candidate.tones.includes(pitchClass) ? 0 : weight), 0)
    const bassSupport = (bassWeights[candidate.root] ?? 0) * .7 + (bassWeights[candidate.tones[2] ?? candidate.root] ?? 0) * .12
    const diminishedPenalty = candidate.symbol.endsWith('dim') ? totalWeight * .06 : 0
    return { symbol: candidate.symbol, score: chordWeight + bassSupport - outsideWeight * .18 - diminishedPenalty }
  }).sort((left, right) => right.score - left.score)[0]?.symbol ?? null
}

function inferPhraseChords(midi: MidiFile, ranges: SectionRange[], phrases: Phrase[], trackNames?: string[]): Phrase[] {
  return ranges.flatMap((range) => {
    let sectionCursor = range.startBeat
    return phrases
      .filter((phrase) => phrase.sectionId === range.section.id)
      .sort((left, right) => left.order - right.order)
      .map((phrase) => {
        const events: ChordEvent[] = []
        const phraseBeats = phrase.bars * beatsPerBar
        for (let localBeat = 0; localBeat < phraseBeats; localBeat += beatsPerBar) {
          const duration = Math.min(beatsPerBar, phraseBeats - localBeat)
          const symbol = inferChord(midi, sectionCursor + localBeat, sectionCursor + localBeat + duration, trackNames)
          if (!symbol) continue
          const previous = events.at(-1)
          if (previous?.symbol === symbol && previous.beat + previous.duration === localBeat) previous.duration += duration
          else events.push({ id: `${phrase.id}-chord-${events.length + 1}`, symbol, beat: localBeat, duration })
        }
        sectionCursor += phraseBeats
        return { ...phrase, chords: events }
      })
  })
}

function emotionPoints(ranges: SectionRange[], emotionId: string, family: EmotionFamily): CompositionProject['emotionPlan']['points'] {
  return ranges.map((range, index) => {
    const progress = ranges.length === 1 ? .5 : index / (ranges.length - 1)
    const intensity = family === 'sadness' ? 72 - progress * 38 : family === 'desire' ? 48 + Math.sin(progress * Math.PI) * 38 : 28 + progress * 66
    return { sectionId: range.section.id, emotionId, intensity: Math.round(intensity) }
  })
}

export function createLicensedReferenceExample(spec: Pick<LicensedReferenceSpec, 'id' | 'artist' | 'title' | 'sectionStartBeats' | 'trackNames'>, lyrics: string, midiBytes: Uint8Array): SongExample {
  const midi = new Midi(midiBytes)
  const lyricGroups = parseLyrics(lyrics)
  const ranges = sectionRanges(midi, lyricGroups, spec.sectionStartBeats)
  const { tracks, clips } = tracksAndClips(midi, ranges, spec.trackNames)
  const phrases = inferPhraseChords(midi, ranges, phrasesForLyrics(lyricGroups, ranges), spec.trackNames)
  const tempo = Math.max(20, Math.min(300, Math.round(midi.header.tempos[0]?.bpm ?? 120)))
  const timeSignature = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4]
  const keySignature = midi.header.keySignatures[0]
  const key = keySignature?.key ? `${keySignature.key} ${keySignature.scale}` : 'From imported MIDI'
  const project: CompositionProject = {
    schemaVersion: 3,
    id: `dev-reference-${spec.id}`,
    title: spec.title,
    createdAt: timestamp,
    updatedAt: timestamp,
    story: [
      { id: 'story-premise', label: 'Premise', text: 'A hopeful reflection on historic change and the possibility that former divisions can give way to a shared future.' },
      { id: 'story-conflict', label: 'Conflict', text: 'Memory and uncertainty complicate that hope: the old world is still emotionally present while the new one has not fully arrived.' },
      { id: 'story-turn', label: 'Turning point', text: 'The private act of imagining change expands into a collective invitation to trust and participate in it.' },
      { id: 'story-resolution', label: 'Resolution', text: 'The arrangement repeatedly returns to its central musical idea, allowing hope to feel persistent rather than naïve.' },
    ],
    frame: {
      genre: 'Rock ballad',
      key,
      tempo,
      meter: `${timeSignature[0] ?? 4}/${timeSignature[1] ?? 4}`,
      groove: 'Slow pulse',
      references: `Development-only licensed study of ${spec.artist} — ${spec.title}. Full lyrics and MIDI arrangement are loaded from local, Git-ignored assets and are excluded from production builds.`,
    },
    emotionPlan: {
      dominantFamily: 'wonder',
      featured: [
        { id: 'nostalgia', name: 'Nostalgia', families: { sadness: .58, wonder: .52 }, color: '#718295' },
        { id: 'yearning', name: 'Yearning', families: { desire: .88, sadness: .28 }, color: '#b8789d' },
        { id: 'hope', name: 'Hope', families: { joy: .82, wonder: .72 }, color: '#7ca98c' },
      ],
      points: [
        ...emotionPoints(ranges, 'nostalgia', 'sadness'),
        ...emotionPoints(ranges, 'yearning', 'desire'),
        ...emotionPoints(ranges, 'hope', 'joy'),
      ],
    },
    sections: ranges.map((range) => range.section),
    phrases,
    tracks,
    sequenceClips: clips,
    alternatives: [],
    operations: [
      { id: 'operation-1', description: 'Loaded full lyrics from a local licensed reference', createdAt: timestamp },
      { id: 'operation-2', description: 'Mapped lyric headings and MIDI markers into song sections', createdAt: timestamp },
      { id: 'operation-3', description: `Sequenced ${tracks.length} complete MIDI tracks from the local licensed reference`, createdAt: timestamp },
      { id: 'operation-4', description: 'Inferred phrase chords from the local licensed MIDI arrangement', createdAt: timestamp },
    ],
  }

  return {
    id: spec.id,
    kind: 'licensed-reference',
    availability: 'ready',
    artist: spec.artist,
    theme: 'Hope, memory, and collective change',
    summary: 'A development-only real-world reference for confronting the app’s story, emotion, structure, lyric, and arrangement models with an existing song.',
    steps: ['Context', 'Musical frame', 'Emotion reading', 'Song structure', 'Full lyrics', 'Complete MIDI arrangement'],
    project,
  }
}

function createUnavailableReferenceExample(spec: LicensedReferenceSpec, missingAssets: string[]): SongExample {
  return {
    id: spec.id,
    kind: 'licensed-reference',
    availability: 'missing-assets',
    artist: spec.artist,
    missingAssets,
    theme: 'Hope, memory, and collective change',
    summary: 'This development reference is configured, but its local licensed assets have not been supplied yet.',
    steps: ['Context', 'Musical frame', 'Emotion reading', 'Song structure', 'Full lyrics', 'Complete MIDI arrangement'],
    project: {
      schemaVersion: 3,
      id: `dev-reference-${spec.id}`,
      title: spec.title,
      createdAt: timestamp,
      updatedAt: timestamp,
      story: [],
      frame: {
        genre: 'Rock ballad',
        key: 'From imported MIDI',
        tempo: 120,
        meter: '4/4',
        groove: 'Slow pulse',
        references: `Waiting for local licensed assets for ${spec.artist} — ${spec.title}.`,
      },
      emotionPlan: { dominantFamily: 'wonder', featured: [], points: [] },
      sections: [],
      phrases: [],
      tracks: [],
      sequenceClips: [],
      alternatives: [],
      operations: [],
    },
  }
}

async function readOptional(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function loadLicensedReferenceExamples(root: string): Promise<SongExample[]> {
  const examples: SongExample[] = []
  for (const spec of licensedReferences) {
    const [lyrics, midi] = await Promise.all([
      readOptional(resolve(root, spec.lyricsPath)),
      readOptional(resolve(root, spec.midiPath)),
    ])
    const missingAssets = [
      ...(!lyrics ? [spec.lyricsPath] : []),
      ...(!midi ? [spec.midiPath] : []),
    ]
    if (!lyrics || !midi) {
      examples.push(createUnavailableReferenceExample(spec, missingAssets))
    } else {
      examples.push(createLicensedReferenceExample(spec, lyrics.toString('utf8'), midi))
    }
  }
  return examples
}

export const licensedReferenceAssetPaths = licensedReferences.flatMap((spec) => [spec.lyricsPath, spec.midiPath])
