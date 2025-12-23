import type { MarkdownEnv, MarkdownRenderer } from 'vitepress'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as generator from './generator'
import { parseProps } from './utils'

export function markdownDemoTagBlock(md: MarkdownRenderer) {
  function addRenderRule(type: string) {
    const defaultRender = md.renderer.rules[type]
    md.renderer.rules[type] = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const content = token.content.trim()
      if (!content.match(/^<demo\s/))
        return defaultRender!(tokens, idx, options, env, self)

      const { path } = env as MarkdownEnv
      const props = parseProps(content)

      if (!props.src && (!props.files || !props.files.length)) {
        console.error(`rendering ${path}: src prop is required`)
        return defaultRender!(tokens, idx, options, env, self)
      }

      if (!props.src && props.files && props.files.length > 0)
        props.src = props.files[0]

      const { src, description = '', attributes, attributesInJs, type = 'vue', files, ...otherProps } = props
      const markdownPath = dirname(path)
      const srcPath = resolve(markdownPath, src).replace(/\\/g, '/')

      if (!fs.existsSync(srcPath)) {
        console.error(`rendering ${path}: ${srcPath} does not exist`)
        return defaultRender!(tokens, idx, options, env, self)
      }

      const resolvedFiles: string[] = []
      if (files && Array.isArray(files)) {
        files.forEach((f: string) => {
          const fp = resolve(markdownPath, f).replace(/\\/g, '/')
          if (fs.existsSync(fp))
            resolvedFiles.push(fp)
        })
      }

      const demoScripts = generator.generateDemoComponent(md, env, {
        code: fs.readFileSync(srcPath, 'utf-8'),
        path: resolve(markdownPath, src),
        props: otherProps,
        jsAttr: attributesInJs,
        files: resolvedFiles,
        attr: attributes,
        desc: description,
        type,
      })

      return demoScripts
    }
  }
  addRenderRule('html_block')
  addRenderRule('html_inline')
}
