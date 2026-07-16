const candidates: Record<number, readonly RegExp[]> = {
  36: [/^kick$/],
  37: [/rimshot/, /^stick/, /^clave/],
  38: [/^snare$/],
  42: [/hihat-closed/, /hihat-close/, /hhclosed/],
  45: [/tom-low/, /tom-l/, /tom-3/, /mid-tom/],
  46: [/hihat-open/, /hhopen/],
  49: [/^crash$/, /cymbal/, /cymball/],
  51: [/^ride$/, /^crash$/, /cymbal/, /cymball/],
}

export function resolveDrumSampleName(groupNames: readonly string[], midiNote: number): string | number {
  const groups = groupNames.map((name) => ({ name, normalized: name.toLowerCase() }))
  for (const pattern of candidates[midiNote] ?? []) {
    const match = groups.find((group) => pattern.test(group.normalized))
    if (match) return match.name
  }
  return midiNote
}
