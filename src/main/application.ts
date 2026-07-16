import { ComposerApplication } from '@application/services/ComposerApplication'
import { MidiFileExporter } from '@infrastructure/export/midi/MidiFileExporter'
import { BrowserProjectRepository } from '@infrastructure/persistence/browser/BrowserProjectRepository'
import { WebAudioPlaybackEngine } from '@infrastructure/playback/web-audio/WebAudioPlaybackEngine'
import { BrowserPortableProjectGateway } from '@infrastructure/platform/BrowserPortableProjectGateway'
import { TauriPortableProjectGateway } from '@infrastructure/platform/TauriPortableProjectGateway'
import { TauriProjectRepository } from '@infrastructure/persistence/tauri/TauriProjectRepository'
import { isTauri } from '@tauri-apps/api/core'

export const composerApplication = new ComposerApplication(
  isTauri() ? new TauriProjectRepository() : new BrowserProjectRepository(),
  new WebAudioPlaybackEngine(),
  new MidiFileExporter(),
  isTauri() ? new TauriPortableProjectGateway() : new BrowserPortableProjectGateway(),
)
