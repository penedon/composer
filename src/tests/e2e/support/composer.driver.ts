import { expect, type Download, type Page } from '@playwright/test'

export class ComposerDriver {
  constructor(readonly page: Page) {}

  async createProject(title = 'E2E Song'): Promise<void> {
    await this.page.goto('/projects')
    await this.page.getByLabel('Project title').fill(title)
    await this.page.getByRole('button', { name: 'Create project' }).click()
    await expect(this.page.getByRole('heading', { name: 'Write the song before writing the music.' })).toBeVisible()
  }

  async openPhase(name: 'Story' | 'Frame' | 'Emotions' | 'Structure' | 'Compose' | 'Arrange' | 'Export'): Promise<void> {
    const navigation = this.page.getByRole('navigation', { name: 'Composition phases' })
    const link = navigation.getByRole('link', { name: new RegExp(name) })
    if (['Story', 'Frame', 'Emotions'].includes(name) && !(await link.isVisible())) {
      await navigation.getByRole('button', { name: 'Expand Song setup' }).click()
    }
    await link.click()
  }

  async localProjectJson(projectId = 'e2e-song'): Promise<string | null> {
    return this.page.evaluate((id) => localStorage.getItem(`composer:project:${id}`), projectId)
  }

  async capture(name: string): Promise<void> {
    await expect(this.page).toHaveScreenshot(name, { fullPage: true, animations: 'disabled' })
  }

  async downloadFrom(buttonName: string): Promise<Download> {
    const download = this.page.waitForEvent('download')
    await this.page.getByRole('button', { name: buttonName }).click()
    return download
  }
}
