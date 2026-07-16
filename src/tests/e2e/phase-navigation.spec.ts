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
