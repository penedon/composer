import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { ComposerDriver } from './support/composer.driver'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('semantic wheel exposes shades, blends, weights, and unavailable emotions', async ({ page }, testInfo) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Semantic Wheel')
  await composer.openPhase('Emotions')

  await page.getByRole('button', { name: 'Change Melancholy' }).click()
  const map = page.getByRole('group', { name: 'Semantic emotion map' })
  await expect(map).toBeVisible()
  await expect(map.locator('[data-emotion-id]')).toHaveCount(18)
  await expect(map.getByRole('radio', { name: /^Longing\./ })).toBeDisabled()

  await map.getByRole('button', { name: /^Sadness:/ }).click()
  await map.getByRole('radio', { name: /^Grief\./ }).click()
  await expect(page.getByText('Direct, deep sorrow in response to loss.')).toBeVisible()
  await page.getByRole('button', { name: 'Use emotion' }).click()
  await expect(page.getByRole('navigation', { name: 'Composition phases' })).toContainText('Grief')

  await page.getByRole('button', { name: 'Change Longing' }).click()
  await expect(map.getByRole('radio', { name: /^Longing\./ })).toBeChecked()
  const details = page.locator('.emotion-picker__details')
  await expect(details).toContainText('Blended emotion')
  await expect(details).toContainText('Love70%')
  await expect(details).toContainText('Sadness60%')
  await expect(details).toContainText('Desire50%')
  const accessibility = await new AxeBuilder({ page }).include('.emotion-picker').analyze()
  expect(accessibility.violations).toEqual([])
  await page.locator('.emotion-picker').screenshot({ path: testInfo.outputPath('implemented-emotion-picker.png') })
})

test.describe('compact picker', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('opens on the linear family route without horizontal overflow', async ({ page }) => {
    const composer = new ComposerDriver(page)
    await composer.createProject('Compact Emotions')
    await composer.openPhase('Emotions')

    await page.getByRole('button', { name: 'Change Longing' }).click()
    await expect(page.getByRole('group', { name: 'Semantic emotion map' })).toHaveCount(0)
    await expect(page.getByRole('radiogroup', { name: 'Emotion families' })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Shades of Love' })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(hasHorizontalOverflow).toBe(false)
  })
})
