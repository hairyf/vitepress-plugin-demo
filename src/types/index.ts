export interface Metadata {
  absolutePath: string
  relativePath: string
  fileName: string
}

export interface FileItem {
  name: string
  typescript?: string
  javascript?: string
  typescriptHtml?: string
  javascriptHtml?: string
}
