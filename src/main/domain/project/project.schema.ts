import { z } from 'zod'

const narrativeBlockSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  text: z.string(),
})

const frameSchema = z.object({
  genre: z.string(),
  key: z.string(),
  tempo: z.number().min(20).max(300),
  meter: z.string(),
  groove: z.string(),
  references: z.string(),
})

const emotionFamilySchema = z.enum(['joy', 'love', 'sadness', 'fear', 'anger', 'rejection', 'wonder', 'desire'])

const featuredEmotionSchema = z.object({
  id: z.string(),
  name: z.string(),
  families: z.partialRecord(emotionFamilySchema, z.number().min(0).max(1)),
  color: z.string(),
})

const emotionPointSchema = z.object({ sectionId: z.string(), emotionId: z.string(), intensity: z.number().min(0).max(100) })

const sectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  bars: z.number().int().positive(),
  color: z.string(),
  narrativePurpose: z.string(),
  sourceSectionId: z.string().nullable(),
})

const chordSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  beat: z.number().min(0),
  duration: z.number().positive(),
})

const phraseSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  order: z.number().int().min(0),
  bars: z.number().int().positive(),
  lyrics: z.string(),
  chords: z.array(chordSchema),
  emotionId: z.string().nullable(),
  rhythm: z.string(),
  dynamics: z.string(),
  instrumental: z.boolean(),
})

const trackSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['harmony', 'bass', 'rhythm', 'melody']),
  instrument: z.string(),
  volume: z.number().min(0).max(1),
  muted: z.boolean(),
  solo: z.boolean(),
})

const alternativeSchema = z.object({ id: z.string(), targetId: z.string(), name: z.string(), phrase: phraseSchema })
const operationSchema = z.object({ id: z.string(), description: z.string(), createdAt: z.string() })

export const compositionProjectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  story: z.array(narrativeBlockSchema),
  frame: frameSchema,
  emotionPlan: z.object({
    dominantFamily: emotionFamilySchema,
    featured: z.array(featuredEmotionSchema).max(3),
    points: z.array(emotionPointSchema),
  }),
  sections: z.array(sectionSchema),
  phrases: z.array(phraseSchema),
  tracks: z.array(trackSchema),
  alternatives: z.array(alternativeSchema),
  operations: z.array(operationSchema),
})
