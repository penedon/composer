import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test('tracker clicks seek to the exact section position and immediately play from there', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: 'Explore every step' }).click()
  await page.waitForLoadState('networkidle')
  const progress = page.getByRole('progressbar', { name: 'Song preview progress' })
  const intro = page.getByRole('button', { name: /^Intro, 4 of 4 bars composed$/ })
  const introBounds = await intro.boundingBox()
  expect(introBounds).not.toBeNull()
  if (!introBounds) return

  await page.mouse.click(introBounds.x + introBounds.width / 2, introBounds.y + introBounds.height / 2)

  await expect(page.getByText('Playing song', { exact: true })).toBeVisible()
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(5)
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(8)
  await expect(page.locator('.song-position__current')).toContainText('Intro')

  const chorus = page.getByRole('button', { name: /^Chorus, 8 of 8 bars composed$/ })
  const chorusBounds = await chorus.boundingBox()
  expect(chorusBounds).not.toBeNull()
  if (!chorusBounds) return

  await page.mouse.click(chorusBounds.x + chorusBounds.width * .25, chorusBounds.y + chorusBounds.height / 2)

  await expect(page.getByText('Playing song', { exact: true })).toBeVisible()
  await expect(page.locator('.song-position__current')).toContainText('Chorus')
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(51)
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(54)
})
