import type { EmotionFamily, FeaturedEmotion } from '@domain/project/project.types'

export const emotionFamilies: EmotionFamily[] = ['joy', 'love', 'sadness', 'fear', 'anger', 'rejection', 'wonder', 'desire']

export interface EmotionFamilyPresentation {
  id: EmotionFamily
  label: string
  color: string
  shortDescription: string
}

export const emotionFamilyPresentation: EmotionFamilyPresentation[] = [
  { id: 'joy', label: 'Joy', color: '#e2b84f', shortDescription: 'Light, ease, and celebration' },
  { id: 'love', label: 'Love', color: '#d46f80', shortDescription: 'Care, closeness, and devotion' },
  { id: 'sadness', label: 'Sadness', color: '#6687bd', shortDescription: 'Loss, reflection, and heaviness' },
  { id: 'fear', label: 'Fear', color: '#8274ae', shortDescription: 'Uncertainty, threat, and alarm' },
  { id: 'anger', label: 'Anger', color: '#ca6252', shortDescription: 'Friction, protest, and force' },
  { id: 'rejection', label: 'Rejection', color: '#79936a', shortDescription: 'Distance, refusal, and disconnection' },
  { id: 'wonder', label: 'Wonder', color: '#55a3a3', shortDescription: 'Discovery, surprise, and awe' },
  { id: 'desire', label: 'Desire', color: '#c68b50', shortDescription: 'Pull, anticipation, and pursuit' },
]

export type EmotionId =
  | 'serenity'
  | 'delight'
  | 'devotion'
  | 'tenderness'
  | 'longing'
  | 'melancholy'
  | 'grief'
  | 'despair'
  | 'apprehension'
  | 'terror'
  | 'irritation'
  | 'rage'
  | 'contempt'
  | 'alienation'
  | 'amazement'
  | 'confusion'
  | 'yearning'
  | 'anticipation'

export type TaxonomyEmotion = FeaturedEmotion & { id: EmotionId }

export interface EmotionPresentation {
  kind: 'shade' | 'blend'
  description: string
}

export const emotionTaxonomy: TaxonomyEmotion[] = [
  { id: 'serenity', name: 'Serenity', families: { joy: .8 }, color: '#75a88c' },
  { id: 'delight', name: 'Delight', families: { joy: 1, wonder: .2 }, color: '#d6b95f' },
  { id: 'devotion', name: 'Devotion', families: { love: .9, desire: .2 }, color: '#c66d91' },
  { id: 'tenderness', name: 'Tenderness', families: { love: .8, joy: .2 }, color: '#d88f9e' },
  { id: 'longing', name: 'Longing', families: { love: .7, sadness: .6, desire: .5 }, color: '#d46f80' },
  { id: 'melancholy', name: 'Melancholy', families: { sadness: .9, love: .2 }, color: '#6687bd' },
  { id: 'grief', name: 'Grief', families: { sadness: 1, love: .25 }, color: '#536d99' },
  { id: 'despair', name: 'Despair', families: { sadness: 1, fear: .25 }, color: '#c68b50' },
  { id: 'apprehension', name: 'Apprehension', families: { fear: .75, wonder: .15 }, color: '#8a82b8' },
  { id: 'terror', name: 'Terror', families: { fear: 1 }, color: '#66548e' },
  { id: 'irritation', name: 'Irritation', families: { anger: .65 }, color: '#c17155' },
  { id: 'rage', name: 'Rage', families: { anger: 1, rejection: .2 }, color: '#b34b43' },
  { id: 'contempt', name: 'Contempt', families: { rejection: .8, anger: .35 }, color: '#8d7151' },
  { id: 'alienation', name: 'Alienation', families: { rejection: .8, sadness: .45 }, color: '#65736c' },
  { id: 'amazement', name: 'Amazement', families: { wonder: 1, joy: .25 }, color: '#5da5aa' },
  { id: 'confusion', name: 'Confusion', families: { wonder: .55, fear: .25 }, color: '#728d9f' },
  { id: 'yearning', name: 'Yearning', families: { desire: .9, sadness: .35 }, color: '#b86f9e' },
  { id: 'anticipation', name: 'Anticipation', families: { desire: .7, joy: .3, fear: .15 }, color: '#b58f54' },
]

/**
 * Visual semantics live outside FeaturedEmotion so saved project files remain
 * compatible. Keeping this as an exhaustive record makes a newly-added emotion
 * fail type-checking until its stable classification and description are chosen.
 */
export const emotionPresentation: Record<EmotionId, EmotionPresentation> = {
  serenity: { kind: 'shade', description: 'Quiet contentment with room to breathe.' },
  delight: { kind: 'shade', description: 'Bright pleasure touched by surprise.' },
  devotion: { kind: 'shade', description: 'Steady love shaped by commitment.' },
  tenderness: { kind: 'shade', description: 'Gentle care with emotional openness.' },
  longing: { kind: 'blend', description: 'A sustained pull toward something loved but absent.' },
  melancholy: { kind: 'shade', description: 'Reflective sadness with a lingering softness.' },
  grief: { kind: 'shade', description: 'Direct, deep sorrow in response to loss.' },
  despair: { kind: 'shade', description: 'Sadness intensified by fear that nothing will change.' },
  apprehension: { kind: 'shade', description: 'Unease before an uncertain possibility.' },
  terror: { kind: 'shade', description: 'Overwhelming fear with immediate urgency.' },
  irritation: { kind: 'shade', description: 'Low, persistent friction that asks for release.' },
  rage: { kind: 'shade', description: 'Anger at full force, close to rejection.' },
  contempt: { kind: 'blend', description: 'Rejection sharpened by anger and judgment.' },
  alienation: { kind: 'blend', description: 'Disconnection weighted by sadness.' },
  amazement: { kind: 'shade', description: 'Wonder opened into vivid surprise.' },
  confusion: { kind: 'shade', description: 'Wonder made unstable by uncertainty.' },
  yearning: { kind: 'blend', description: 'Desire stretched across emotional distance.' },
  anticipation: { kind: 'blend', description: 'Forward pull mixing hope, uncertainty, and desire.' },
}

export interface EmotionFamilyOption {
  emotion: FeaturedEmotion
  kind: 'core' | 'blend'
  familySummary: string
}

function familyWeight(emotion: FeaturedEmotion, family: EmotionFamily): number {
  return emotion.families[family] ?? 0
}

export function primaryEmotionFamily(emotion: FeaturedEmotion, preferred?: EmotionFamily): EmotionFamily {
  const highest = Math.max(...emotionFamilies.map((family) => familyWeight(emotion, family)))
  if (preferred && familyWeight(emotion, preferred) === highest) return preferred
  return emotionFamilies.find((family) => familyWeight(emotion, family) === highest) ?? emotionFamilies[0]!
}

export function emotionFamilySummary(emotion: FeaturedEmotion): string {
  return emotionFamilies
    .filter((family) => familyWeight(emotion, family) > 0)
    .sort((left, right) => familyWeight(emotion, right) - familyWeight(emotion, left))
    .map((family) => emotionFamilyPresentation.find((item) => item.id === family)?.label ?? family)
    .join(' + ')
}

export function emotionsForFamily(family: EmotionFamily): EmotionFamilyOption[] {
  return emotionTaxonomy
    .filter((emotion) => familyWeight(emotion, family) > 0)
    .map((emotion) => {
      return {
        emotion,
        kind: emotionPresentation[emotion.id].kind === 'shade' && primaryEmotionFamily(emotion) === family ? 'core' as const : 'blend' as const,
        familySummary: emotionFamilySummary(emotion),
      }
    })
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === 'core' ? -1 : 1
      return familyWeight(right.emotion, family) - familyWeight(left.emotion, family) || left.emotion.name.localeCompare(right.emotion.name)
    })
}
