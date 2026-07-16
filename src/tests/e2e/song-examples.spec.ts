import { expect, test } from '@playwright/test'

test('opens a complete example and exposes every composition step', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/projects')

  const examples = page.getByRole('region', { name: 'Song examples' })
  await examples.scrollIntoViewIfNeeded()
  const originalExample = examples.getByRole('article').filter({ hasText: 'The Long Road Within' })
  const licensedReference = examples.getByRole('article').filter({ hasText: 'Wind of Change' })
  await expect(originalExample).toBeVisible()
  await expect(originalExample.getByRole('list', { name: 'Completed composition steps' }).getByRole('listitem')).toHaveCount(7)
  await expect(licensedReference).toBeVisible()
  const waitingForAssets = licensedReference.getByRole('button', { name: 'Waiting for local assets' })
  if (await waitingForAssets.count()) {
    await expect(licensedReference).toContainText('Local assets required')
    await expect(waitingForAssets).toBeDisabled()
  } else {
    await expect(licensedReference.getByRole('button', { name: 'Open reference study' })).toBeEnabled()
  }
  await expect(originalExample).toHaveScreenshot('song-examples.png', { animations: 'disabled' })
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
  await expect(page.getByRole('button', { name: /^Edit Melody guide sequence for Chorus,/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Edit Rhythm sequence for Final chorus/ })).toBeVisible()

  await phases.getByRole('link', { name: /Export/ }).click()
  await expect(page.getByText('15', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export MIDI' })).toBeVisible()
})

test('opens the licensed Wind of Change reference when local assets are available', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('licensed-reference-test')) return
    localStorage.clear()
    sessionStorage.setItem('licensed-reference-test', 'ready')
  })
  await page.goto('/projects')

  const reference = page.getByRole('article').filter({ hasText: 'Wind of Change' })
  const openButton = reference.getByRole('button', { name: 'Open reference study' })
  test.skip(await openButton.count() === 0, 'Licensed reference assets are not available in this environment')

  await openButton.click()
  await expect(page.getByLabel('Song title')).toHaveValue('Wind of Change')
  await expect(page.getByLabel('Premise text')).toHaveValue(/historic change/)

  const phases = page.getByRole('navigation', { name: 'Composition phases' })
  await phases.getByRole('link', { name: /Frame/ }).click()
  await expect(page.getByLabel('Genre')).toHaveValue('Rock ballad')
  await expect(page.getByText('Rock ballad · Slow pulse')).toBeVisible()

  await phases.getByRole('link', { name: /Compose/ }).click()
  await expect(page.getByRole('button', { name: /^Verse 1 15 bars$/ })).toBeVisible()
  await page.getByRole('button', { name: /^Verse 1 15 bars$/ }).click()
  await expect(page.getByLabel('Chord events').first().getByRole('button').first()).toBeVisible()

  await page.evaluate(() => {
    const key = 'composer:project:dev-reference-scorpions-wind-of-change'
    const raw = localStorage.getItem(key)
    if (!raw) throw new Error('Expected saved licensed reference')
    const project = JSON.parse(raw) as { phrases: Array<{ chords: unknown[] }> }
    project.phrases.forEach((phrase) => { phrase.chords = [] })
    localStorage.setItem(key, JSON.stringify(project))
  })
  await page.reload()
  await expect(page.getByLabel('Chord events').first().getByRole('button').first()).toBeVisible()

  await phases.getByRole('link', { name: /Arrange/ }).click()
  await expect(page.getByText('11 separate instrument tracks')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Edit Drums sequence for Chorus,/ }).first()).toBeVisible()
})

test('upgrades a previously saved example that predates instrument sequences', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('example-upgrade-test')) return
    localStorage.clear()
    sessionStorage.setItem('example-upgrade-test', 'ready')
  })
  await page.goto('/projects')
  await page.getByRole('button', { name: 'Explore every step' }).click()

  await page.evaluate(() => {
    const key = 'composer:project:example-long-road-within'
    const raw = localStorage.getItem(key)
    if (!raw) throw new Error('Expected seeded example')
    const project = JSON.parse(raw) as { sequenceClips: unknown[]; operations: Array<{ description: string }>; frame: { tempo: number } }
    project.sequenceClips = []
    project.operations = project.operations.filter((operation) => !operation.description.startsWith('Sequenced '))
    project.frame.tempo = 97
    localStorage.setItem(key, JSON.stringify(project))
  })

  await page.goto('/projects/example-long-road-within/arrange')
  await expect(page.locator('output').filter({ hasText: '97 BPM' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Edit Harmony sequence for Intro,/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Edit Rhythm sequence for Final chorus,/ })).toBeVisible()

  const upgraded = await page.evaluate(() => JSON.parse(localStorage.getItem('composer:project:example-long-road-within') ?? '{}') as { sequenceClips?: unknown[] })
  expect(upgraded.sequenceClips).toHaveLength(36)
})
