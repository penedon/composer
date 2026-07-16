import { expect, test } from '@playwright/test'

import { ComposerDriver } from './support/composer.driver'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('phrase tools use descriptive icons and a structural actions menu', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Toolbar Song')
  await composer.openPhase('Compose')

  const phrase = page.locator('.phrase-block').first()
  await phrase.click()

  const play = phrase.getByRole('button', { name: 'Play phrase', exact: true })
  await play.hover()
  await expect(phrase.getByRole('tooltip', { name: 'Play phrase', exact: true })).toBeVisible()

  const loop = phrase.getByRole('button', { name: 'Loop phrase' })
  await loop.hover()
  await expect(phrase.getByRole('tooltip', { name: 'Loop phrase' })).toBeVisible()
  await phrase.getByRole('button', { name: 'Save phrase alternative' }).focus()
  await expect(phrase.getByRole('tooltip', { name: 'Save alternative' })).toBeVisible()

  await phrase.getByRole('button', { name: 'Chord possibilities' }).click()
  await expect(phrase.getByText('Requested possibilities')).toBeVisible()

  await phrase.getByRole('button', { name: 'More phrase actions' }).click()
  const menu = phrase.getByRole('menu', { name: 'Phrase actions' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem')).toHaveCount(5)

  await menu.getByRole('menuitem', { name: /Split phrase/ }).click()
  await expect(page.locator('.phrase-block')).toHaveCount(3)
  await expect(menu).toHaveCount(0)
})
