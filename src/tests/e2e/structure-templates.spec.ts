import { expect, test } from '@playwright/test'

import { ComposerDriver } from './support/composer.driver'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('structure templates preview safely and apply as one undoable operation', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Template Lab')
  await composer.openPhase('Structure')

  await expect(page.getByLabel('Selected structure template')).toContainText('Story arc')
  await expect(page.getByLabel('Choose a structure template')).toHaveCount(0)
  const before = await composer.localProjectJson('template-lab')
  const originalPhraseCount = JSON.parse(before!).phrases.length

  await page.getByRole('button', { name: 'Change template' }).click()
  const templateLibrary = page.getByLabel('Choose a structure template')
  await expect(templateLibrary.getByRole('button')).toHaveCount(9)
  await templateLibrary.getByRole('button', { name: /AABA standard/ }).click()
  await expect(templateLibrary).toHaveCount(0)
  expect(await composer.localProjectJson('template-lab')).toBe(before)
  await expect(page.getByText('4 sections · 32 bars')).toBeVisible()

  await page.getByRole('button', { name: 'Apply AABA standard' }).click()
  await expect(page.getByRole('button', { name: 'Apply AABA standard' })).toHaveCount(0)
  await expect(page.getByLabel('Selected structure template')).toContainText('Applied to this song')
  await expect(page.getByLabel('A1 name')).toBeVisible()
  await expect(page.getByText('Variation of A1')).toHaveCount(2)
  await expect.poll(async () => JSON.parse((await composer.localProjectJson('template-lab'))!).phrases.length).toBe(originalPhraseCount)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: 'Apply AABA standard' })).toBeVisible()
  await expect(page.getByLabel('Intro name')).toBeVisible()
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(page.getByRole('button', { name: 'Apply AABA standard' })).toHaveCount(0)
  await expect(page.getByLabel('A1 name')).toBeVisible()

  await page.getByRole('link', { name: /Composer/ }).click()
  await page.getByRole('link', { name: /Template Lab/ }).click()
  await composer.openPhase('Structure')
  await expect(page.getByLabel('Selected structure template')).toContainText('AABA standard')
  await expect(page.getByRole('button', { name: 'Apply AABA standard' })).toHaveCount(0)
})
