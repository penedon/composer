import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { MidiFileExporter } from '@infrastructure/export/midi/MidiFileExporter'
import { createPaperConstellationsProject } from '@tests/fixtures/projects/paperConstellations.fixture'

const project = createPaperConstellationsProject()
const directory = resolve(process.cwd(), 'test-assets/original-reference-songs')
await mkdir(directory, { recursive: true })
await writeFile(resolve(directory, `${project.id}.composer.json`), `${JSON.stringify(project, null, 2)}\n`)
await writeFile(resolve(directory, `${project.id}.mid`), new MidiFileExporter().export(project).bytes)
