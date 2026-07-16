import { expect, test } from '@playwright/test'

import { ComposerDriver } from './support/composer.driver'

test('header, phase rail, and transport remain fixed while the canvas scrolls', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Fixed Chrome')
  await composer.openPhase('Emotions')

  const header = page.locator('header.project-bar')
  const rail = page.getByRole('navigation', { name: 'Composition phases' })
  const footer = page.locator('footer.transport-bar')
  const canvas = page.locator('main.workspace-layout__main')
  const before = await Promise.all([header.boundingBox(), rail.boundingBox(), footer.boundingBox()])

  await canvas.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await expect.poll(() => canvas.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  const after = await Promise.all([header.boundingBox(), rail.boundingBox(), footer.boundingBox()])

  expect(after).toEqual(before)
  expect(after[0]?.y).toBe(0)
  expect(after[1]?.y).toBe(after[0]?.height)
  expect(Math.round((after[2]?.y ?? 0) + (after[2]?.height ?? 0))).toBe(page.viewportSize()?.height)
})
