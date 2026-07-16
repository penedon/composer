import type { SongExample } from './example.types'
import { longRoadWithinExample } from './longRoadWithin.example'
import { licensedSongExamples } from 'virtual:licensed-song-examples'

export const songExamples: SongExample[] = [longRoadWithinExample, ...licensedSongExamples]
