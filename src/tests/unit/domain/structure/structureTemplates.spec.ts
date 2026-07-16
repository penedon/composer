import { describe, expect, it } from 'vitest'

import { createProject } from '@domain/project/project.factory'
import { applyStructureTemplate } from '@domain/project/project.operations'
import { lastAppliedStructureTemplateId, structureTemplateById, structureTemplateOperationDescription, structureTemplates } from '@domain/structure/structureTemplates'

describe('structure templates', () => {
  it('provides valid, versioned templates with resolvable variation sources', () => {
    expect(structureTemplates).toHaveLength(9)
    expect(new Set(structureTemplates.map((template) => template.id)).size).toBe(structureTemplates.length)

    for (const template of structureTemplates) {
      expect(template.version).toBe(1)
      expect(template.sections.length).toBeGreaterThan(0)
      const keys = template.sections.map((section) => section.key)
      expect(new Set(keys).size).toBe(keys.length)
      for (const section of template.sections) {
        if (section.sourceKey) expect(keys).toContain(section.sourceKey)
      }
    }
  })

  it('applies AABA while preserving phrases and emotional intent', () => {
    const project = createProject()
    const originalPhraseIds = project.phrases.map((phrase) => phrase.id)
    const template = structureTemplateById('aaba')!
    const result = applyStructureTemplate(project, template)

    expect(result.sections.map((section) => section.name)).toEqual(['A1', 'A2', 'B bridge', 'A3'])
    expect(result.sections[1]?.sourceSectionId).toBe(result.sections[0]?.id)
    expect(result.sections[3]?.sourceSectionId).toBe(result.sections[0]?.id)
    expect(result.phrases.map((phrase) => phrase.id)).toEqual(originalPhraseIds)
    expect(result.phrases.every((phrase) => result.sections.some((section) => section.id === phrase.sectionId))).toBe(true)
    expect(result.emotionPlan.points).toHaveLength(result.sections.length * result.emotionPlan.featured.length)
  })

  it('keeps every phrase when reducing a song to the blank canvas', () => {
    const project = createProject()
    const result = applyStructureTemplate(project, structureTemplateById('blank-canvas')!)

    expect(result.sections).toHaveLength(1)
    expect(result.phrases).toHaveLength(project.phrases.length)
    expect(result.phrases.every((phrase) => phrase.sectionId === result.sections[0]?.id)).toBe(true)
    expect(result.phrases.map((phrase) => phrase.order)).toEqual(project.phrases.map((_, index) => index))
  })

  it('identifies the most recently applied template from persistent operation history', () => {
    const storyArc = structureTemplateById('story-arc')!
    const aaba = structureTemplateById('aaba')!
    const operations = [
      { description: structureTemplateOperationDescription(storyArc) },
      { description: 'Rename section' },
      { description: structureTemplateOperationDescription(aaba) },
      { description: 'Resize section' },
    ]

    expect(lastAppliedStructureTemplateId(operations)).toBe('aaba')
  })
})
