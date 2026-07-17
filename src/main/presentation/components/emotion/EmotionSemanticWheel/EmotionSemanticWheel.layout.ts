import { emotionFamilies, primaryEmotionFamily } from '@domain/emotion/emotionTaxonomy'
import type { EmotionFamily, FeaturedEmotion } from '@domain/project/project.types'

export interface EmotionWheelNodeLayout {
  angle: number
  family: EmotionFamily
  radius: number
}

const familySectorDegrees = 45
const maximumNodeSpacingDegrees = 18
const nodeSpanDegrees = 32

export function emotionFamilyAngle(family: EmotionFamily): number {
  return emotionFamilies.indexOf(family) * familySectorDegrees - 90
}

/**
 * Distributes every emotion around its strongest family while keeping the whole
 * sibling group inside that family's sector. More taxonomy entries reduce the
 * spacing between nodes; they never move a node toward the center.
 */
export function layoutEmotionNodes(
  emotions: readonly FeaturedEmotion[],
  radius: number,
): Map<string, EmotionWheelNodeLayout> {
  const emotionsByFamily = new Map<EmotionFamily, FeaturedEmotion[]>(
    emotionFamilies.map((family) => [family, []]),
  )

  for (const emotion of emotions) {
    emotionsByFamily.get(primaryEmotionFamily(emotion))?.push(emotion)
  }

  const positions = new Map<string, EmotionWheelNodeLayout>()
  for (const family of emotionFamilies) {
    const siblings = emotionsByFamily.get(family) ?? []
    const spacing = siblings.length <= 1
      ? 0
      : Math.min(maximumNodeSpacingDegrees, nodeSpanDegrees / (siblings.length - 1))

    siblings.forEach((emotion, index) => {
      positions.set(emotion.id, {
        angle: emotionFamilyAngle(family) + (index - (siblings.length - 1) / 2) * spacing,
        family,
        radius,
      })
    })
  }

  return positions
}
