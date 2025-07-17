import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSyncFn as createWorker } from 'synckit'

export interface Format {
  (code: string, lang: string): string
}

const syncify = createWorker<Format>(
  path.join(dirname(), './eslint.worker.mjs'),
)

export const format: Format = (code, lang) => {
  try {
    return decodeURIComponent(syncify(code, lang))
  }
  catch {
    return code
  }
}

function dirname() {
  try {
    return path.dirname(fileURLToPath(import.meta.url))
  }
  catch {
    return __dirname || ''
  }
}
