import { expect, test } from '@playwright/test'

import { ComposerDriver } from './support/composer.driver'

test('phase rail is free navigation rather than a locked wizard', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Free Navigation')
  for (const phase of ['Export', 'Story', 'Arrange', 'Emotions', 'Compose'] as const) {
    await composer.openPhase(phase)
    await expect(page).toHaveURL(new RegExp(phase.toLowerCase()))
  }
})

test('expanded rail visibly preserves every setup destination after setup contracts', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Visible Setup')
  await composer.openPhase('Structure')

  const navigation = page.getByRole('navigation', { name: 'Composition phases' })
  const setup = navigation.locator('.phase-rail__setup')
  await expect(setup).toBeVisible()
  await expect(navigation.getByRole('button', { name: 'Expand Song setup' })).toBeVisible()

  for (const phase of ['Story', 'Frame', 'Emotions'] as const) {
    const link = navigation.getByRole('link', { name: phase, exact: true })
    await expect(link).toBeVisible()
    await expect(link).toBeInViewport()
    const box = await link.boundingBox()
    expect(box?.width).toBeGreaterThan(120)
    expect(box?.height).toBeGreaterThan(24)
  }

  await expect(setup).toContainText('Story')
  await expect(setup).toContainText('Frame')
  await expect(setup).toContainText('Emotions')

  await page.reload()
  await expect(navigation.getByRole('link', { name: 'Story', exact: true })).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Frame', exact: true })).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Emotions', exact: true })).toBeVisible()
})

for (const viewport of [
  { name: 'full height', width: 1440, height: 760 },
  { name: 'compact height', width: 980, height: 560 },
] as const) {
  test(`setup navigation does not flex-collapse at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const composer = new ComposerDriver(page)
    await composer.createProject(`Setup ${viewport.name}`)
    await composer.openPhase('Structure')

    const navigation = page.getByRole('navigation', { name: 'Composition phases' })
    const setup = navigation.locator('.phase-rail__setup')
    const setupLinks = navigation.locator('#song-setup-links')

    await expect(setup).toBeVisible()
    await expect(setupLinks).toBeVisible()
    expect((await setup.boundingBox())?.height).toBeGreaterThan(140)
    expect((await setupLinks.boundingBox())?.height).toBeGreaterThan(80)

    for (const phase of ['Story', 'Frame', 'Emotions'] as const) {
      const link = navigation.getByRole('link', { name: phase, exact: true })
      await expect(link).toBeVisible()
      expect((await link.boundingBox())?.height).toBeGreaterThan(24)
    }

    const railCanScroll = await navigation.evaluate((element) => element.scrollHeight > element.clientHeight)
    if (viewport.name === 'compact height') expect(railCanScroll).toBe(true)
  })
}

test('sidebars contract and restore independently', async ({ page }) => {
  const composer = new ComposerDriver(page)
  await composer.createProject('Sidebar Focus')

  await page.getByRole('button', { name: 'Contract composition navigation' }).click()
  const navigation = page.getByRole('navigation', { name: 'Composition phases' })
  await expect(navigation.getByRole('link')).toHaveCount(7)
  await expect(navigation.getByRole('link', { name: 'Story' })).toBeVisible()
  await composer.openPhase('Arrange')

  await page.getByRole('button', { name: 'Hide composition context' }).click()
  await expect(page.getByRole('complementary', { name: 'Composition context', includeHidden: true })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Show composition context' })).toBeVisible()

  await page.getByRole('button', { name: 'Expand composition navigation' }).click()
  await expect(page.getByRole('button', { name: 'Show composition context' })).toBeVisible()
  await expect(navigation.getByText('WORKBENCH')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Contract composition navigation' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show composition context' })).toBeVisible()
})
