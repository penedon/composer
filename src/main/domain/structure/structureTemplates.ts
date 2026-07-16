import type { OperationRecord } from '@domain/project/project.types'

export interface StructureTemplateSection {
  key: string
  name: string
  bars: number
  color: string
  narrativePurpose: string
  sourceKey: string | null
}

export interface StructureTemplate {
  id: string
  version: 1
  name: string
  description: string
  bestFor: string
  sections: StructureTemplateSection[]
}

const colors = {
  intro: '#60594d', verse: '#45546b', pre: '#625444', chorus: '#754a55', bridge: '#584c68', outro: '#60594d', drop: '#765843', part: '#4f5d57', solo: '#6b5946',
}

export const structureTemplates: StructureTemplate[] = [
  {
    id: 'story-arc', version: 1, name: 'Story arc', description: 'Intro · Verse · Pre · Chorus · Verse · Bridge · Final · Outro', bestFor: 'A clear emotional transformation',
    sections: [
      { key: 'intro', name: 'Intro', bars: 4, color: colors.intro, narrativePurpose: 'Establish the world and emotional question', sourceKey: null },
      { key: 'verse-1', name: 'Verse 1', bars: 8, color: colors.verse, narrativePurpose: 'Introduce the situation', sourceKey: null },
      { key: 'pre', name: 'Pre-chorus', bars: 4, color: colors.pre, narrativePurpose: 'Increase pressure before the central statement', sourceKey: null },
      { key: 'chorus', name: 'Chorus', bars: 8, color: colors.chorus, narrativePurpose: 'State the emotional center', sourceKey: null },
      { key: 'verse-2', name: 'Verse 2', bars: 8, color: colors.verse, narrativePurpose: 'Deepen or complicate the situation', sourceKey: 'verse-1' },
      { key: 'bridge', name: 'Bridge', bars: 8, color: colors.bridge, narrativePurpose: 'Reveal a new perspective', sourceKey: null },
      { key: 'final-chorus', name: 'Final chorus', bars: 8, color: colors.chorus, narrativePurpose: 'Restate the center after the change', sourceKey: 'chorus' },
      { key: 'outro', name: 'Outro', bars: 4, color: colors.outro, narrativePurpose: 'Leave the listener with the outcome', sourceKey: 'intro' },
    ],
  },
  {
    id: 'direct-pop', version: 1, name: 'Direct pop', description: 'Verse · Chorus · Verse · Chorus · Bridge · Chorus', bestFor: 'Fast arrival at a memorable hook',
    sections: [
      { key: 'verse-1', name: 'Verse 1', bars: 8, color: colors.verse, narrativePurpose: 'Set up the hook quickly', sourceKey: null },
      { key: 'chorus', name: 'Chorus', bars: 8, color: colors.chorus, narrativePurpose: 'Deliver the central hook', sourceKey: null },
      { key: 'verse-2', name: 'Verse 2', bars: 8, color: colors.verse, narrativePurpose: 'Add a second angle', sourceKey: 'verse-1' },
      { key: 'chorus-2', name: 'Chorus 2', bars: 8, color: colors.chorus, narrativePurpose: 'Reinforce the hook', sourceKey: 'chorus' },
      { key: 'bridge', name: 'Bridge', bars: 8, color: colors.bridge, narrativePurpose: 'Create contrast before the ending', sourceKey: null },
      { key: 'final-chorus', name: 'Final chorus', bars: 8, color: colors.chorus, narrativePurpose: 'Give the hook its fullest form', sourceKey: 'chorus' },
    ],
  },
  {
    id: 'aaba', version: 1, name: 'AABA standard', description: 'A1 · A2 · B bridge · A3', bestFor: 'Compact songs built around one main idea',
    sections: [
      { key: 'a1', name: 'A1', bars: 8, color: colors.verse, narrativePurpose: 'Present the main melodic and lyrical idea', sourceKey: null },
      { key: 'a2', name: 'A2', bars: 8, color: colors.verse, narrativePurpose: 'Repeat the idea with new detail', sourceKey: 'a1' },
      { key: 'b', name: 'B bridge', bars: 8, color: colors.bridge, narrativePurpose: 'Contrast harmony, melody, or viewpoint', sourceKey: null },
      { key: 'a3', name: 'A3', bars: 8, color: colors.verse, narrativePurpose: 'Return to the idea with resolution', sourceKey: 'a1' },
    ],
  },
  {
    id: 'folk-ballad', version: 1, name: 'Folk ballad', description: 'Intro · Verse · Verse · Refrain · Verse · Refrain · Outro', bestFor: 'Narrative lyrics with a recurring lesson',
    sections: [
      { key: 'intro', name: 'Intro', bars: 4, color: colors.intro, narrativePurpose: 'Set the place and voice', sourceKey: null },
      { key: 'verse-1', name: 'Verse 1', bars: 8, color: colors.verse, narrativePurpose: 'Begin the story', sourceKey: null },
      { key: 'verse-2', name: 'Verse 2', bars: 8, color: colors.verse, narrativePurpose: 'Move the story forward', sourceKey: 'verse-1' },
      { key: 'refrain', name: 'Refrain', bars: 4, color: colors.chorus, narrativePurpose: 'State the recurring lesson', sourceKey: null },
      { key: 'verse-3', name: 'Verse 3', bars: 8, color: colors.verse, narrativePurpose: 'Deliver the consequence or turn', sourceKey: 'verse-1' },
      { key: 'final-refrain', name: 'Final refrain', bars: 4, color: colors.chorus, narrativePurpose: 'Let the lesson change after the story', sourceKey: 'refrain' },
      { key: 'outro', name: 'Outro', bars: 4, color: colors.outro, narrativePurpose: 'Close the scene', sourceKey: 'intro' },
    ],
  },
  {
    id: 'classic-rock', version: 1, name: 'Classic rock', description: 'Intro · Verse · Verse · Chorus · Solo · Bridge · Final · Outro', bestFor: 'Band dynamics and an instrumental spotlight',
    sections: [
      { key: 'intro', name: 'Riff intro', bars: 8, color: colors.intro, narrativePurpose: 'Establish the instrumental identity', sourceKey: null },
      { key: 'verse-1', name: 'Verse 1', bars: 8, color: colors.verse, narrativePurpose: 'Present the conflict', sourceKey: null },
      { key: 'verse-2', name: 'Verse 2', bars: 8, color: colors.verse, narrativePurpose: 'Raise the stakes', sourceKey: 'verse-1' },
      { key: 'chorus', name: 'Chorus', bars: 8, color: colors.chorus, narrativePurpose: 'Release into the main statement', sourceKey: null },
      { key: 'solo', name: 'Instrumental solo', bars: 16, color: colors.solo, narrativePurpose: 'Let an instrument carry the emotional peak', sourceKey: null },
      { key: 'bridge', name: 'Bridge', bars: 8, color: colors.bridge, narrativePurpose: 'Reset before the last release', sourceKey: null },
      { key: 'final-chorus', name: 'Final chorus', bars: 16, color: colors.chorus, narrativePurpose: 'Expand the main statement', sourceKey: 'chorus' },
      { key: 'outro', name: 'Riff outro', bars: 8, color: colors.outro, narrativePurpose: 'Return to the instrumental identity', sourceKey: 'intro' },
    ],
  },
  {
    id: 'twelve-bar-blues', version: 1, name: '12-bar blues', description: 'Verse · Verse · Solo · Final verse', bestFor: 'Repeated harmonic form with lyrical variation',
    sections: [
      { key: 'verse-1', name: '12-bar verse 1', bars: 12, color: colors.verse, narrativePurpose: 'State the problem in an AAB lyric pattern', sourceKey: null },
      { key: 'verse-2', name: '12-bar verse 2', bars: 12, color: colors.verse, narrativePurpose: 'Develop the problem', sourceKey: 'verse-1' },
      { key: 'solo', name: '12-bar solo', bars: 12, color: colors.solo, narrativePurpose: 'Answer the voice instrumentally', sourceKey: 'verse-1' },
      { key: 'final-verse', name: 'Final 12-bar verse', bars: 12, color: colors.verse, narrativePurpose: 'Deliver the final answer or unresolved truth', sourceKey: 'verse-1' },
    ],
  },
  {
    id: 'build-and-drop', version: 1, name: 'Build & drop', description: 'Intro · Build · Drop · Breakdown · Build · Final drop · Outro', bestFor: 'Energy arcs driven by texture and rhythm',
    sections: [
      { key: 'intro', name: 'Intro', bars: 8, color: colors.intro, narrativePurpose: 'Introduce the core sound gradually', sourceKey: null },
      { key: 'build-1', name: 'Build 1', bars: 8, color: colors.pre, narrativePurpose: 'Accumulate tension and density', sourceKey: null },
      { key: 'drop', name: 'Drop', bars: 16, color: colors.drop, narrativePurpose: 'Release the main rhythmic idea', sourceKey: null },
      { key: 'breakdown', name: 'Breakdown', bars: 8, color: colors.bridge, narrativePurpose: 'Remove energy and expose a new color', sourceKey: null },
      { key: 'build-2', name: 'Build 2', bars: 8, color: colors.pre, narrativePurpose: 'Rebuild with a meaningful variation', sourceKey: 'build-1' },
      { key: 'final-drop', name: 'Final drop', bars: 16, color: colors.drop, narrativePurpose: 'Deliver the largest release', sourceKey: 'drop' },
      { key: 'outro', name: 'Outro', bars: 8, color: colors.outro, narrativePurpose: 'Dissolve the energy', sourceKey: 'intro' },
    ],
  },
  {
    id: 'through-composed', version: 1, name: 'Through-composed', description: 'Part I · Part II · Part III · Part IV · Coda', bestFor: 'Continuous development without repeated sections',
    sections: [
      { key: 'part-1', name: 'Part I', bars: 8, color: colors.part, narrativePurpose: 'Introduce the first musical state', sourceKey: null },
      { key: 'part-2', name: 'Part II', bars: 8, color: '#53645d', narrativePurpose: 'Transform rather than repeat', sourceKey: null },
      { key: 'part-3', name: 'Part III', bars: 8, color: '#625968', narrativePurpose: 'Move into the central contrast', sourceKey: null },
      { key: 'part-4', name: 'Part IV', bars: 8, color: '#6c594f', narrativePurpose: 'Carry the consequences forward', sourceKey: null },
      { key: 'coda', name: 'Coda', bars: 4, color: colors.outro, narrativePurpose: 'Conclude without a literal return', sourceKey: null },
    ],
  },
  {
    id: 'blank-canvas', version: 1, name: 'Blank canvas', description: 'One editable section', bestFor: 'Building a form manually from the first block',
    sections: [{ key: 'section-1', name: 'Section 1', bars: 8, color: colors.part, narrativePurpose: 'Define this section in your own terms', sourceKey: null }],
  },
]

export function structureTemplateById(id: string): StructureTemplate | undefined {
  return structureTemplates.find((template) => template.id === id)
}

export function structureTemplateOperationDescription(template: StructureTemplate): string {
  return `Apply ${template.name} structure template`
}

export function lastAppliedStructureTemplateId(operations: Pick<OperationRecord, 'description'>[]): string | null {
  for (let index = operations.length - 1; index >= 0; index -= 1) {
    const operation = operations[index]
    if (!operation) continue
    const template = structureTemplates.find((candidate) => operation.description === structureTemplateOperationDescription(candidate))
    if (template) return template.id
  }
  return null
}
