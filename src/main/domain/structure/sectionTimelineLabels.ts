import type { SongSection } from '@domain/project/project.types'

export interface SectionTimelineLabel {
  sectionId: string
  acronym: string
  fullName: string
}

type SectionKind = 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'custom'

function sectionKind(name: string): SectionKind {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  if (/\bpre chorus\b/.test(normalized) || normalized.startsWith('pre ')) return 'pre-chorus'
  if (/\bintro\b/.test(normalized)) return 'intro'
  if (/\bverse\b/.test(normalized)) return 'verse'
  if (/\bchorus\b/.test(normalized)) return 'chorus'
  if (/\bbridge\b/.test(normalized)) return 'bridge'
  if (/\boutro\b/.test(normalized)) return 'outro'
  return 'custom'
}

function customAcronym(name: string): string {
  const words = name.match(/[A-Za-z0-9]+/g) ?? []
  if (!words.length) return 'S'
  if (words.length === 1) return words[0]!.slice(0, 3).toUpperCase()
  return words.slice(0, 3).map((word) => word[0]!.toUpperCase()).join('')
}

export function buildSectionTimelineLabels(sections: SongSection[]): SectionTimelineLabel[] {
  const occurrences = new Map<SectionKind, number>()
  const totals = sections.reduce((counts, section) => {
    const kind = sectionKind(section.name)
    counts.set(kind, (counts.get(kind) ?? 0) + 1)
    return counts
  }, new Map<SectionKind, number>())

  return sections.map((section) => {
    const kind = sectionKind(section.name)
    const occurrence = (occurrences.get(kind) ?? 0) + 1
    occurrences.set(kind, occurrence)

    const base = { intro: 'I', verse: 'V', 'pre-chorus': 'PC', chorus: 'C', bridge: 'B', outro: 'O', custom: customAcronym(section.name) }[kind]
    const numbered = kind === 'verse' || kind === 'chorus' || (totals.get(kind) ?? 0) > 1
    return { sectionId: section.id, acronym: `${base}${numbered ? occurrence : ''}`, fullName: section.name }
  })
}
