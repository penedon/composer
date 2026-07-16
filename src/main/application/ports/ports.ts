import type { CompositionProject, Phrase, ProjectSummary, TrackRole } from '@domain/project/project.types'

export interface ProjectRepository {
  list(): Promise<ProjectSummary[]>
  load(id: string): Promise<CompositionProject | null>
  save(project: CompositionProject): Promise<void>
  remove(id: string): Promise<void>
}

export interface PhrasePlaybackRequest {
  phrase: Phrase
  tempo: number
  key: string
  meter: string
  leadInChord: string | null
  loop: boolean
}

export interface PlaybackEngine {
  playPhrase(request: PhrasePlaybackRequest): Promise<void>
  playSong(project: CompositionProject, startBeat?: number): Promise<number>
  auditionChord(symbol: string): Promise<void>
  auditionNote(midiNote: number, role: TrackRole, volume?: number): Promise<void>
  stop(): Promise<void>
}

export interface BinaryFile {
  name: string
  mimeType: string
  bytes: Uint8Array<ArrayBuffer>
}

export interface MidiExporter {
  export(project: CompositionProject): BinaryFile
}

export interface PortableProjectGateway {
  exportProject(project: CompositionProject): BinaryFile
  importProject(text: string): CompositionProject
  download(file: BinaryFile): void
  selectProject?(): Promise<CompositionProject | null>
}
