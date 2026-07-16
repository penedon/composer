// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { globSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = join(process.cwd(), 'src/main')

function imports(path: string): string[] {
  return [...readFileSync(path, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]!)
}

describe('architecture import boundaries', () => {
  it('keeps domain independent and application unaware of presentation/infrastructure', () => {
    const violations: string[] = []
    for (const path of globSync(`${root}/**/*.{ts,vue}`)) {
      const location = relative(root, path)
      for (const dependency of imports(path)) {
        if (location.startsWith('domain/') && /@(?:application|infrastructure|presentation|main)/.test(dependency)) violations.push(`${location} -> ${dependency}`)
        if (location.startsWith('application/') && /@(?:infrastructure|presentation)/.test(dependency)) violations.push(`${location} -> ${dependency}`)
      }
    }
    expect(violations).toEqual([])
  })
})
