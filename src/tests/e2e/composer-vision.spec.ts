import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { ComposerDriver } from './support/composer.driver'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('artist journey preserves the composition vision', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject()

  await page.getByLabel('Premise text').fill('A lighthouse keeper writes to a ship that will never return.')
  await page.getByLabel('Conflict text').fill('Every beam is both hope and proof of absence.')
  await expect.poll(() => composer.localProjectJson()).toContain('lighthouse keeper')
  await composer.capture('story-workspace.png')

  await composer.openPhase('Emotions')
  await page.getByRole('button', { name: /Change dominant emotion family/ }).click()
  await page.getByRole('radio', { name: /^Love:/ }).click()
  await page.getByRole('button', { name: 'Use family' }).click()
  await page.getByRole('button', { name: 'Change Melancholy' }).click()
  await page.getByRole('radio', { name: /^Sadness:/ }).click()
  await page.getByRole('radio', { name: /Grief/ }).click()
  await page.getByRole('button', { name: 'Use emotion' }).click()
  await page.getByRole('group', { name: 'Grief' }).getByRole('slider').first().fill('61')
  await expect(page.getByRole('navigation', { name: 'Composition phases' })).toContainText('Grief')
  await composer.capture('emotion-arc.png')

  await composer.openPhase('Structure')
  await page.getByRole('button', { name: 'Vary' }).first().click()
  await expect(page.getByText('Variation of Intro')).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('Variation of Intro')).toHaveCount(0)
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(page.getByText('Variation of Intro')).toBeVisible()
  await composer.capture('structure-variation.png')

  await composer.openPhase('Compose')
  const lyric = page.getByLabel('Lyrics for phrase 1')
  await lyric.fill('The light keeps crossing an empty sea')
  await lyric.press('Shift+Enter')
  await expect(page.getByLabel('Lyrics for phrase 2').locator('..')).toHaveClass(/phrase-block--active/)

  await page.getByRole('button', { name: 'Chord possibilities' }).first().click()
  await composer.capture('chord-suggestions.png')
  const beforeAudition = await composer.localProjectJson()
  await page.getByRole('button', { name: /^Audition / }).first().click()
  expect(await composer.localProjectJson()).toBe(beforeAudition)
  await page.getByRole('button', { name: 'Use chord' }).first().click()
  await expect.poll(() => composer.localProjectJson()).not.toBe(beforeAudition)
  await composer.capture('phrase-workspace.png')

  await composer.openPhase('Arrange')
  await page.getByLabel('Instrument for Harmony').selectOption({ label: 'Electric piano' })
  await page.getByRole('button', { name: 'S' }).first().click()
  await expect(page.getByLabel('Instrument for Harmony')).toHaveValue('keys.electric-piano')
  await composer.capture('arrangement.png')

  await composer.openPhase('Export')
  const midi = await composer.downloadFrom('Export MIDI')
  expect(midi.suggestedFilename()).toBe('e2e-song.mid')
  const stream = await midi.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const midiBytes = [...Buffer.concat(chunks)]
  expect(String.fromCharCode(...midiBytes.slice(0, 4))).toBe('MThd')
  expect((midiBytes[10]! << 8) | midiBytes[11]!).toBe(5)
  const project = await composer.downloadFrom('Download project')
  expect(project.suggestedFilename()).toBe('e2e-song.composer.json')

  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
  await composer.capture('export-workspace.png')

  await page.getByRole('link', { name: /Composer/ }).click()
  await page.getByRole('link', { name: /E2E Song/ }).click()
  await expect(page.getByLabel('Premise text')).toHaveValue(/lighthouse keeper/)
})
