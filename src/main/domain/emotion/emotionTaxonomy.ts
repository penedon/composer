import type { EmotionFamily, FeaturedEmotion } from '@domain/project/project.types'

export const emotionFamilies: EmotionFamily[] = ['joy', 'love', 'sadness', 'fear', 'anger', 'rejection', 'wonder', 'desire']

export const emotionTaxonomy: FeaturedEmotion[] = [
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
