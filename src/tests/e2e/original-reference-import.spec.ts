import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

test('imports the complete original song and exposes its lyrics and arrangement', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/projects')
  await page.locator('input[type="file"]').setInputFiles(resolve(process.cwd(), 'test-assets/original-reference-songs/paper-constellations.composer.json'))
  await expect(page.getByRole('heading', { name: 'Write the song before writing the music.' })).toBeVisible()
  await expect(page.getByLabel('Song title')).toHaveValue('Paper Constellations')

  await page.getByRole('navigation', { name: 'Composition phases' }).getByRole('link', { name: /Compose/ }).click()
  await page.getByRole('button', { name: /Verse 8 bars/ }).click()
  await expect(page.getByLabel('Lyrics for phrase 1')).toHaveValue('I fold the avenue into a paper sky')

  await page.getByRole('navigation', { name: 'Composition phases' }).getByRole('link', { name: /Arrange/ }).click()
  await expect(page.getByText('4 separate instrument tracks')).toBeVisible()

  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(page.locator('.transport-bar').getByRole('status')).toHaveText('Playing song')
  await expect(page.getByRole('button', { name: 'Stop song playback' })).toBeVisible()
  await page.getByRole('button', { name: 'Stop song playback' }).click()
  await expect(page.locator('.transport-bar').getByRole('status')).toHaveText('Ready')
})
