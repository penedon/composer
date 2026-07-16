import { parseProject } from '@domain/project/project.migrations'
import type { CompositionProject } from '@domain/project/project.types'
import type { BinaryFile, PortableProjectGateway } from '@application/ports/ports'

export class BrowserPortableProjectGateway implements PortableProjectGateway {
  exportProject(project: CompositionProject): BinaryFile {
    const bytes = new TextEncoder().encode(JSON.stringify(project, null, 2))
    return { name: `${project.id}.composer.json`, mimeType: 'application/json', bytes }
  }

  importProject(text: string): CompositionProject {
    return parseProject(JSON.parse(text))
  }

  download(file: BinaryFile): void {
    const blob = new Blob([file.bytes], { type: file.mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    anchor.click()
    URL.revokeObjectURL(url)
  }
}
