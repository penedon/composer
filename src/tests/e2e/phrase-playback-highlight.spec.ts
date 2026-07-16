import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('Compose highlights the sounding chord during phrase and full-song playback', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: 'Explore every step' }).click()
  await page.getByRole('navigation', { name: 'Composition phases' }).getByRole('link', { name: /Compose/ }).click()

  const currentChord = page.locator('.phrase-block__chords button[aria-current="true"]')
  const firstPhrase = page.locator('.phrase-block').first()
  await firstPhrase.getByRole('button', { name: 'Play phrase', exact: true }).click()

  await expect(currentChord).toHaveText(/Em/)
  await expect(firstPhrase).toHaveClass(/phrase-block--playing/)

  await page.getByRole('button', { name: 'Stop song playback' }).click()
  await expect(currentChord).toHaveCount(0)

  const verse = page.locator('.song-position').getByRole('button', { name: /^Verse 1, 8 of 8 bars composed$/ })
  const verseBounds = await verse.boundingBox()
  expect(verseBounds).not.toBeNull()
  if (!verseBounds) return
  await page.mouse.click(verseBounds.x + verseBounds.width * .1, verseBounds.y + verseBounds.height / 2)

  await expect(page.getByText('Playing song', { exact: true })).toBeVisible()
  await expect(page.locator('.compose-workspace__sections button[aria-pressed="true"]')).toContainText('Verse 1')
  await expect(page.locator('.phrase-block--active textarea')).toHaveValue(/I left in a borrowed coat/)
  await expect(currentChord).toHaveText(/Em/)
})
