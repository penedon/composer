import { expect, test } from '@playwright/test'

test('opens a complete example and exposes every composition step', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/projects')

  const examples = page.getByRole('region', { name: 'Song examples' })
  await examples.scrollIntoViewIfNeeded()
  await expect(examples).toContainText('The Long Road Within')
  await expect(examples.getByRole('list', { name: 'Completed composition steps' }).getByRole('listitem')).toHaveCount(7)
  await expect(examples).toHaveScreenshot('song-examples.png', { animations: 'disabled' })
  await examples.getByRole('button', { name: 'Explore every step' }).click()

  await expect(page.getByLabel('Song title')).toHaveValue('The Long Road Within')
  await expect(page.getByLabel('Premise text')).toHaveValue(/traveler leaves home alone/)

  const phases = page.getByRole('navigation', { name: 'Composition phases' })
  await phases.getByRole('link', { name: /Frame/ }).click()
  await expect(page.getByText('Indie folk rock · Walking pulse')).toBeVisible()

  await phases.getByRole('link', { name: /Emotions/ }).click()
  const featuredEmotions = page.getByLabel('Featured emotions')
  await expect(featuredEmotions.getByRole('button', { name: 'Change Alienation' })).toBeVisible()
  await expect(featuredEmotions.getByRole('button', { name: 'Change Yearning' })).toBeVisible()
  await expect(featuredEmotions.getByRole('button', { name: 'Change Serenity' })).toBeVisible()

  await phases.getByRole('link', { name: /Structure/ }).click()
  await expect(page.getByText('Variation of Chorus')).toHaveCount(2)

  await phases.getByRole('link', { name: /Compose/ }).click()
  await page.getByRole('button', { name: /^Chorus 8 bars$/ }).click()
  await expect(page.getByLabel('Lyrics for phrase 1')).toHaveValue('On the long road with nobody beside me')
  await expect(page.getByText('1 saved alternative')).toBeVisible()

  await phases.getByRole('link', { name: /Arrange/ }).click()
  await expect(page.getByText('4 separate instrument tracks')).toBeVisible()

  await phases.getByRole('link', { name: /Export/ }).click()
  await expect(page.getByText('15', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export MIDI' })).toBeVisible()
})
