import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeFile } from '@tauri-apps/plugin-fs'

import type { BinaryFile, PortableProjectGateway } from '@application/ports/ports'
import { parseProject } from '@domain/project/project.migrations'
import type { CompositionProject } from '@domain/project/project.types'

export class TauriPortableProjectGateway implements PortableProjectGateway {
  exportProject(project: CompositionProject): BinaryFile {
    return { name: `${project.id}.composer.json`, mimeType: 'application/json', bytes: new TextEncoder().encode(JSON.stringify(project, null, 2)) }
  }

  importProject(text: string): CompositionProject {
    return parseProject(JSON.parse(text))
  }

  download(file: BinaryFile): void {
    void save({ defaultPath: file.name, filters: [{ name: file.mimeType === 'audio/midi' ? 'MIDI' : 'Composer project', extensions: [file.name.split('.').at(-1) ?? 'bin'] }] })
      .then(async (path) => { if (path) await writeFile(path, file.bytes) })
  }

  async selectProject(): Promise<CompositionProject | null> {
    const path = await open({ multiple: false, directory: false, filters: [{ name: 'Composer project', extensions: ['json'] }] })
    return typeof path === 'string' ? this.importProject(await readTextFile(path)) : null
  }
}
