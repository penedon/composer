import type { PhrasePlaybackRequest, PlaybackEngine } from '@application/ports/ports'
import { chordMidiNotes } from '@domain/harmony/chords'
import { buildSongPreview } from '@domain/playback/songPreview'
import type { CompositionProject, TrackRole } from '@domain/project/project.types'

export class WebAudioPlaybackEngine implements PlaybackEngine {
  private context: AudioContext | null = null
  private active: OscillatorNode[] = []

  private async audioContext(): Promise<AudioContext | null> {
    if (!window.AudioContext) return null
    this.context ??= new window.AudioContext()
    await this.context.resume()
    return this.context
  }

  private scheduleNote(midiNote: number, start: number, duration: number, role: TrackRole, volume: number): void {
    if (!this.context) return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    const isRhythm = role === 'rhythm'
    oscillator.type = isRhythm ? 'square' : role === 'bass' ? 'sine' : role === 'melody' ? 'sine' : 'triangle'
    oscillator.frequency.value = isRhythm
      ? midiNote === 36 ? 72 : 180
      : 440 * 2 ** ((midiNote - 69) / 12)
    const peak = Math.max(.008, Math.min(.16, volume * (isRhythm ? .07 : role === 'bass' ? .11 : .055)))
    const end = start + Math.max(.04, duration)
    gain.gain.setValueAtTime(.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + .012)
    gain.gain.exponentialRampToValueAtTime(.0001, end)
    oscillator.connect(gain).connect(this.context.destination)
    oscillator.start(start)
    oscillator.stop(end + .02)
    oscillator.addEventListener('ended', () => { this.active = this.active.filter((item) => item !== oscillator) }, { once: true })
    this.active.push(oscillator)
  }

  async playPhrase(request: PhrasePlaybackRequest): Promise<void> {
    await this.stop()
    const context = await this.audioContext()
    if (!context) return
    const secondsPerBeat = 60 / request.tempo
    const start = context.currentTime + .04
    const events = request.leadInChord
      ? [{ id: 'lead-in', symbol: request.leadInChord, beat: -1, duration: 1 }, ...request.phrase.chords]
      : request.phrase.chords

    for (const event of events) {
      for (const midiNote of chordMidiNotes(event.symbol)) {
        this.scheduleNote(midiNote, start + Math.max(0, event.beat) * secondsPerBeat, event.duration * secondsPerBeat * .92, 'harmony', .82)
      }
    }
  }

  async playSong(project: CompositionProject, startBeat = 0): Promise<number> {
    await this.stop()
    const context = await this.audioContext()
    if (!context) return 0
    const preview = buildSongPreview(project)
    if (!preview.events.length || preview.totalBeats <= 0) return 0
    const secondsPerBeat = 60 / project.frame.tempo
    const start = context.currentTime + .04
    const safeStartBeat = Math.max(0, Math.min(startBeat, preview.totalBeats))

    for (const event of preview.events) {
      const eventEndBeat = event.beat + event.duration
      if (eventEndBeat <= safeStartBeat) continue
      const skippedBeats = Math.max(0, safeStartBeat - event.beat)
      const remainingBeats = Math.max(0, event.duration - skippedBeats)
      const relativeStartBeat = Math.max(0, event.beat - safeStartBeat)
      for (const midiNote of event.midiNotes) {
        const seconds = event.role === 'rhythm' ? Math.min(.11, secondsPerBeat * .2) : remainingBeats * secondsPerBeat * .92
        this.scheduleNote(midiNote, start + relativeStartBeat * secondsPerBeat, seconds, event.role, event.volume)
      }
    }
    return preview.totalBeats * secondsPerBeat
  }

  async auditionChord(symbol: string): Promise<void> {
    await this.playPhrase({
      phrase: { id: 'audition', sectionId: 'audition', order: 0, bars: 1, lyrics: '', chords: [{ id: 'audition-chord', symbol, beat: 0, duration: 1 }], emotionId: null, rhythm: '', dynamics: '', instrumental: true },
      tempo: 92,
      key: 'C',
      meter: '4/4',
      leadInChord: null,
      loop: false,
    })
  }

  async stop(): Promise<void> {
    for (const oscillator of this.active) {
      try { oscillator.stop() } catch { /* oscillator already ended */ }
    }
    this.active = []
  }
}
