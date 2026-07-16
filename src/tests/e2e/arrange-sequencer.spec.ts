import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

import { ComposerDriver } from './support/composer.driver'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('writes drum hits and piano notes into separate section clips', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Sequencer Song')
  await composer.openPhase('Arrange')

  const verseTimeline = page.getByRole('button', { name: 'Verse 1, 8 bars', exact: true })
  await expect(verseTimeline).toContainText('V1')
  await expect(verseTimeline).toContainText('Verse 1')
  await expect(verseTimeline.locator('svg')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Pre-chorus, 4 bars', exact: true })).toContainText('PC')
  await expect(page.getByRole('button', { name: 'Final chorus, 8 bars', exact: true })).toContainText('C2')

  await page.getByRole('button', { name: 'Edit empty Rhythm sequence for Verse 1' }).click()
  await expect(page.getByRole('heading', { name: 'Shape the pulse by drum part.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Song sections' }).getByRole('button', { name: 'Verse 1, 8 bars' })).toContainText('V1')
  const loopButton = page.getByRole('button', { name: 'Loop section' })
  await expect(loopButton).toBeVisible()
  await loopButton.hover()
  await expect(page.getByRole('tooltip', { name: 'Loop section' })).toBeVisible()
  await page.getByRole('button', { name: 'Kick, bar 1, beat 1, empty' }).click()
  await expect(page.getByText('Selected snare')).toHaveCount(0)
  await page.getByLabel('Selected note velocity').fill('116')

  await expect.poll(() => composer.localProjectJson('sequencer-song')).toContain('"trackId":"track-rhythm"')
  await expect.poll(() => composer.localProjectJson('sequencer-song')).toContain('"pitch":36')
  await expect.poll(() => composer.localProjectJson('sequencer-song')).toContain('"velocity":116')

  await page.getByRole('button', { name: 'Back to arrangement' }).click()
  await page.getByRole('button', { name: 'Edit empty Harmony sequence for Verse 1' }).click()
  await expect(page.getByRole('heading', { name: 'Write the line harmony will carry.' })).toBeVisible()
  await page.getByRole('button', { name: 'C4, bar 1, beat 1, empty' }).click()

  await expect.poll(() => composer.localProjectJson('sequencer-song')).toContain('"trackId":"track-harmony"')
  await expect.poll(() => composer.localProjectJson('sequencer-song')).toContain('"pitch":60')

  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
})

test('makes an inherited repeated-section sequence into an editable variation', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Variation Song')
  await composer.openPhase('Arrange')

  await page.getByRole('button', { name: 'Edit empty Rhythm sequence for Chorus' }).click()
  await page.getByRole('button', { name: 'Kick, bar 1, beat 1, empty' }).click()
  await page.getByRole('button', { name: 'Back to arrangement' }).click()

  await page.getByRole('button', { name: /Linked Rhythm sequence for Final chorus/ }).click()
  await expect(page.getByRole('status').filter({ hasText: 'This sequence follows chorus' })).toBeVisible()
  await page.getByRole('button', { name: 'Make variation' }).click()
  await page.getByRole('button', { name: 'Snare, bar 1, beat 2, empty' }).click()

  await expect.poll(() => composer.localProjectJson('variation-song')).toContain('"sectionId":"final"')
  await expect.poll(() => composer.localProjectJson('variation-song')).toContain('"sourceClipId":"')
})
