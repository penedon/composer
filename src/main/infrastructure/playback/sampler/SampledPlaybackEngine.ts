import { DrumMachine, Soundfont, type Smplr, type StopFn } from 'smplr'

import type { PhrasePlaybackRequest, PlaybackEngine } from '@application/ports/ports'
import { defaultInstrumentId, instrumentById } from '@domain/arrangement/instrumentCatalog'
import { chordMidiNotes } from '@domain/harmony/chords'
import { buildSongPreview } from '@domain/playback/songPreview'
import type { CompositionProject, TrackRole } from '@domain/project/project.types'

import { resolveDrumSampleName } from './drumSampleMap'
import { samplerPresetFor } from './samplerRegistry'

export class SampledPlaybackEngine implements PlaybackEngine {
  private context: AudioContext | null = null
  private instruments = new Map<string, Promise<Smplr>>()
  private trackGains = new Map<string, GainNode>()
  private activeVoices: StopFn[] = []
  private activeOscillators: OscillatorNode[] = []
  private generation = 0

  private async audioContext(): Promise<AudioContext | null> {
    if (!window.AudioContext) return null
    this.context ??= new window.AudioContext()
    await this.context.resume()
    return this.context
  }

  private resolvedInstrumentId(id: string, role: TrackRole): string {
    const descriptor = instrumentById(id)
    return descriptor?.role === role ? id : defaultInstrumentId[role]
  }

  private trackGain(trackId: string, volume: number): GainNode {
    if (!this.context) throw new Error('Audio context is unavailable')
    let gain = this.trackGains.get(trackId)
    if (!gain) {
      gain = this.context.createGain()
      gain.connect(this.context.destination)
      this.trackGains.set(trackId, gain)
    }
    gain.gain.cancelScheduledValues(this.context.currentTime)
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.context.currentTime)
    return gain
  }

  private instrument(id: string, role: TrackRole, scope = 'audition', destination?: AudioNode): Promise<Smplr> {
    if (!this.context) return Promise.reject(new Error('Audio context is unavailable'))
    const resolvedId = this.resolvedInstrumentId(id, role)
    const cacheKey = `${scope}:${resolvedId}`
    const cached = this.instruments.get(cacheKey)
    if (cached) return cached

    const preset = samplerPresetFor(resolvedId)
    if (!preset) return Promise.reject(new Error(`No sampler preset registered for ${resolvedId}`))
    const output = destination ? { destination } : {}
    const instrument = preset.kind === 'drum-machine'
      ? DrumMachine(this.context, { instrument: preset.preset, ...output, volume: 127 })
      : Soundfont(this.context, { instrument: preset.preset, kit: 'FluidR3_GM', ...output, volume: 127, extraGain: 1, loadLoopData: true })
    const loading = instrument.ready.then(() => instrument as Smplr).catch((cause) => {
      instrument.dispose()
      this.instruments.delete(cacheKey)
      throw cause
    })
    this.instruments.set(cacheKey, loading)
    return loading
  }

  private scheduleFallback(midiNote: number, start: number, duration: number, role: TrackRole, volume: number, velocity: number, destination?: AudioNode): void {
    if (!this.context) return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    const isRhythm = role === 'rhythm'
    oscillator.type = isRhythm ? 'square' : role === 'bass' ? 'sine' : role === 'melody' ? 'sine' : 'triangle'
    oscillator.frequency.value = isRhythm ? midiNote === 36 ? 72 : 180 : 440 * 2 ** ((midiNote - 69) / 12)
    const peak = Math.max(.008, Math.min(.14, volume * Math.max(.08, velocity / 127) * (isRhythm ? .07 : role === 'bass' ? .11 : .055)))
    const end = start + Math.max(.04, duration)
    gain.gain.setValueAtTime(.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + .012)
    gain.gain.exponentialRampToValueAtTime(.0001, end)
    oscillator.connect(gain).connect(destination ?? this.context.destination)
    oscillator.start(start)
    oscillator.stop(end + .02)
    oscillator.addEventListener('ended', () => { this.activeOscillators = this.activeOscillators.filter((item) => item !== oscillator) }, { once: true })
    this.activeOscillators.push(oscillator)
  }

  private drumSampleName(instrument: Smplr, midiNote: number): string | number {
    if (!('getGroupNames' in instrument) || typeof instrument.getGroupNames !== 'function') return midiNote
    return resolveDrumSampleName(instrument.getGroupNames() as string[], midiNote)
  }

  private scheduleSample(instrument: Smplr, midiNote: number, start: number, duration: number, role: TrackRole, velocity: number): void {
    const voice = instrument.start({
      note: role === 'rhythm' ? this.drumSampleName(instrument, midiNote) : midiNote,
      time: start,
      duration: role === 'rhythm' ? null : Math.max(.04, duration),
      velocity: Math.max(1, Math.min(127, Math.round(velocity))),
    })
    this.activeVoices.push(voice)
  }

  async playPhrase(request: PhrasePlaybackRequest): Promise<void> {
    await this.stop()
    const context = await this.audioContext()
    if (!context) return
    const generation = this.generation
    const instrumentId = request.instrumentId ?? defaultInstrumentId.harmony
    let instrument: Smplr | null = null
    try { instrument = await this.instrument(instrumentId, 'harmony') } catch { /* use synthesized fallback */ }
    if (generation !== this.generation) return

    const secondsPerBeat = 60 / request.tempo
    const start = context.currentTime + .04
    const events = request.leadInChord
      ? [{ id: 'lead-in', symbol: request.leadInChord, beat: -1, duration: 1 }, ...request.phrase.chords]
      : request.phrase.chords
    for (const event of events) {
      for (const midiNote of chordMidiNotes(event.symbol)) {
        const eventStart = start + Math.max(0, event.beat) * secondsPerBeat
        const duration = event.duration * secondsPerBeat * .92
        if (instrument) this.scheduleSample(instrument, midiNote, eventStart, duration, 'harmony', Math.round(84 * .82))
        else this.scheduleFallback(midiNote, eventStart, duration, 'harmony', .82, 84)
      }
    }
  }

  async playSong(project: CompositionProject, startBeat = 0): Promise<number> {
    await this.stop()
    const context = await this.audioContext()
    if (!context) return 0
    const generation = this.generation
    const preview = buildSongPreview(project)
    if (!preview.events.length || preview.totalBeats <= 0) return 0
    const required = new Map<string, { instrumentId: string; role: TrackRole; volume: number }>()
    preview.events.forEach((event) => required.set(event.trackId, { instrumentId: event.instrumentId, role: event.role, volume: event.volume }))
    const prepared = new Map<string, Smplr | null>()
    await Promise.all([...required].map(async ([trackId, track]) => {
      const destination = this.trackGain(trackId, track.volume)
      try { prepared.set(trackId, await this.instrument(track.instrumentId, track.role, trackId, destination)) } catch { prepared.set(trackId, null) }
    }))
    if (generation !== this.generation) return 0

    const secondsPerBeat = 60 / project.frame.tempo
    const start = context.currentTime + .04
    const safeStartBeat = Math.max(0, Math.min(startBeat, preview.totalBeats))
    for (const event of preview.events) {
      const eventEndBeat = event.beat + event.duration
      if (eventEndBeat <= safeStartBeat) continue
      const skippedBeats = Math.max(0, safeStartBeat - event.beat)
      const remainingBeats = Math.max(0, event.duration - skippedBeats)
      const relativeStartBeat = Math.max(0, event.beat - safeStartBeat)
      const eventStart = start + relativeStartBeat * secondsPerBeat
      const duration = event.role === 'rhythm' ? Math.min(.2, secondsPerBeat * .35) : remainingBeats * secondsPerBeat * .92
      const instrument = prepared.get(event.trackId) ?? null
      const destination = this.trackGains.get(event.trackId)
      for (const midiNote of event.midiNotes) {
        if (instrument) this.scheduleSample(instrument, midiNote, eventStart, duration, event.role, event.velocity)
        else this.scheduleFallback(midiNote, eventStart, duration, event.role, 1, event.velocity, destination)
      }
    }
    return preview.totalBeats * secondsPerBeat
  }

  async auditionChord(symbol: string, instrumentId = defaultInstrumentId.harmony): Promise<void> {
    await this.playPhrase({
      phrase: { id: 'audition', sectionId: 'audition', order: 0, bars: 1, lyrics: '', chords: [{ id: 'audition-chord', symbol, beat: 0, duration: 1 }], emotionId: null, rhythm: '', dynamics: '', instrumental: true },
      tempo: 92,
      key: 'C',
      meter: '4/4',
      leadInChord: null,
      loop: false,
      instrumentId,
    })
  }

  async auditionNote(midiNote: number, role: TrackRole, instrumentId: string, volume = .8): Promise<void> {
    const context = await this.audioContext()
    if (!context) return
    let instrument: Smplr | null = null
    try { instrument = await this.instrument(instrumentId, role) } catch { /* use synthesized fallback */ }
    const start = context.currentTime + .01
    const duration = role === 'rhythm' ? .18 : .55
    if (instrument) this.scheduleSample(instrument, midiNote, start, duration, role, Math.round(104 * volume))
    else this.scheduleFallback(midiNote, start, duration, role, volume, 104)
  }

  setTrackVolume(trackId: string, volume: number): void {
    const gain = this.trackGains.get(trackId)
    if (!gain || !this.context) return
    const value = Math.max(0, Math.min(1, volume))
    gain.gain.cancelScheduledValues(this.context.currentTime)
    gain.gain.setTargetAtTime(value, this.context.currentTime, .012)
  }

  async stop(): Promise<void> {
    this.generation += 1
    this.activeVoices.forEach((stop) => { try { stop() } catch { /* voice already ended */ } })
    this.activeVoices = []
    this.activeOscillators.forEach((oscillator) => { try { oscillator.stop() } catch { /* oscillator already ended */ } })
    this.activeOscillators = []
  }
}
