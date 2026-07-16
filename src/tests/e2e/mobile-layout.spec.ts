import { expect, test } from '@playwright/test'

import { ComposerDriver } from './support/composer.driver'

test.use({ viewport: { width: 390, height: 844 } })

test('compact shell preserves the full flow and exposes context on demand', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Pocket Song')

  const navigation = page.getByRole('navigation', { name: 'Composition phases' })
  for (const destination of ['Setup', 'Map', 'Compose', 'Arrange', 'Export']) {
    const link = navigation.getByRole('link', { name: destination, exact: true })
    await expect(link).toBeVisible()
    const box = await link.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(48)
  }

  await navigation.getByRole('link', { name: 'Map', exact: true }).click()
  await expect(page).toHaveURL(/structure/)
  await expect(page.getByText('Structure', { exact: true }).first()).toBeVisible()

  await navigation.getByRole('link', { name: 'Setup', exact: true }).click()
  await expect(page).toHaveURL(/story/)
  for (const phase of ['Story', 'Frame', 'Emotions']) {
    await expect(navigation.getByRole('link', { name: phase, exact: true })).toBeVisible()
  }

  const context = page.getByRole('complementary', { name: 'Composition context' })
  await expect(context).toBeHidden()
  await page.getByRole('button', { name: 'Context', exact: true }).click()
  await expect(context).toBeVisible()
  await expect(context).toContainText('PROJECT INTENT')
  await context.getByRole('button', { name: 'Close' }).click()
  await expect(context).toBeHidden()

  const hasPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(hasPageOverflow).toBe(false)
})

test('compact library uses the bottom edge without reserving workspace navigation', async ({ page }) => {
  await page.goto('/projects')
  const transport = page.locator('.transport-shell')
  await expect(transport).toBeVisible()
  expect((await transport.boundingBox())?.y).toBeGreaterThan(780)
  await expect(page.getByRole('navigation', { name: 'Composition phases' })).toHaveCount(0)
})

test('compact story shell remains visually stable', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Mobile Vision')
  await composer.capture('mobile-story.png')
})
