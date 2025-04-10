import type { MarkdownEnv, MarkdownRenderer } from 'vitepress'
import type { Metadata } from '../../types'
import fs from 'node:fs'
import { relative } from 'node:path'
import process from 'node:process'
import { injectIframeStatement, injectImportStatement, injectScriptStatement } from './inject'
import {
  normalizePath,
  parseMdAttrs,
  transformSfc,
  trim,
  tsToJs,
} from './utils'
import { format } from './utils/eslint'

export interface GenerateOptions {
  type?: 'vue' | 'react' | 'html' | 'js' | 'ts'
  props: Record<string, any>
  desc?: string
  attr?: string
  jsAttr?: string
  path: string
  code: string
}

let index = 1

export function parse(
  md: MarkdownRenderer,
  env: MarkdownEnv,
  {
    props: { twoslash, ...bindProps },
    code,
    desc,
    path,
    attr,
    jsAttr,
    type,
  }: GenerateOptions,
) {
  const highlight = md.options.highlight!
  const name = `DemoComponent${index++}`
  let template = ''
  path = normalizePath(path)

  if (path.endsWith('.html'))
    type = 'html'
  if (path.endsWith('.js'))
    type = 'js'
  if (path.endsWith('.ts'))
    type = 'ts'

  injectImportStatement(env, '{ ref, onMounted, onUnmounted, nextTick }', 'vue')

  if (type === 'html') {
    injectIframeStatement(env, name, path)
    template = `<div ref="${`html${name}ref`}">
        <iframe style="width: 100%; height: auto; border: none"></iframe>
      </div>`
  }

  if (type === 'vue') {
    injectImportStatement(env, name, path)
    injectImportStatement(env, `${name}Raw`, `${path}?raw`)
    template = `<${name} />`
  }

  if (type === 'react') {
    injectImportStatement(env, name, path)
    injectImportStatement(env, `${name}Raw`, `${path}?raw`)
    injectImportStatement(env, '{ createElement }', 'react')
    injectImportStatement(env, '{ createRoot }', 'react-dom/client')
    injectScriptStatement(env, `
      const react${name}ref = ref()
      const root = ref()
      onMounted(async () => {
        await nextTick()
        root.value = createRoot(react${name}ref.value)
        root.value.render(createElement(${name}, {}, null))
      })
      onUnmounted(() => root.value?.unmount())
      `.trim())
    template = `<div ref="${`react${name}ref`}" />`
  }

  const attrs = parseMdAttrs(attr)
  const jsAttrs = parseMdAttrs(jsAttr)
  twoslash && attrs.push('twoslash')
  // twoslash && jsAttrs.push('twoslash')

  attr = attrs.join(',')
  jsAttr = jsAttrs.join(',')

  const isUsingTS = /lang=['"]ts['"]/.test(code)
    || path.endsWith('.tsx')
    || path.endsWith('.ts')
  !isUsingTS && (jsAttr = attr)

  const lang = type === 'react' ? (path.endsWith('.tsx') ? 'tsx' : 'jsx') : type!
  let javascript = ''
  let typescript = ''
  let javascriptHtml = ''
  let typescriptHtml = ''

  const metadata: Metadata = {
    absolutePath: path,
    relativePath: normalizePath(relative(process.cwd(), path)),
    fileName: path.split('/').pop() || '',
  }

  if (lang === 'vue') {
    typescript = isUsingTS ? transformSfc(code, { lang: 'ts' }) : ''
    javascript = transformSfc(code, { lang: 'js', fix: isUsingTS })
    typescriptHtml = isUsingTS ? pre(highlight(typescript, lang, attr)) : ''
    javascriptHtml = pre(highlight!(javascript, lang, jsAttr))
  }

  if (lang === 'html') {
    javascript = code
    javascriptHtml = pre(highlight(code, lang, jsAttr))
  }

  if (lang === 'js') {
    javascript = code
    javascriptHtml = pre(highlight(code, lang, jsAttr))
    injectImportStatement(env, undefined, path)
  }

  if (lang === 'ts') {
    typescript = code
    typescriptHtml = pre(highlight(code, lang, attr))
    javascript = format(tsToJs(typescript), 'js')
    javascriptHtml = pre(highlight(javascript, lang, jsAttr))
    const file = metadata.relativePath.replace(/\//g, '_').replace(/\.ts/, '.js')
    const dirpath = normalizePath(`${__dirname}/temp`)
    const filepath = normalizePath(`${dirpath}/${file}`)
    fs.existsSync(dirpath) || fs.mkdirSync(dirpath)
    fs.writeFileSync(filepath, javascript)
    injectImportStatement(env, undefined, filepath)
  }

  if (lang === 'tsx') {
    typescript = code
    typescriptHtml = pre(highlight(code, lang, attr))
    javascript = format(tsToJs(typescript, { loader: 'tsx', jsx: 'preserve' }), 'jsx')
    javascriptHtml = pre(highlight(javascript, lang, jsAttr))
  }

  if (lang === 'jsx') {
    javascript = code
    javascriptHtml = pre(highlight(code, lang, jsAttr))
  }

  const highlightedHtml = typescriptHtml || javascriptHtml
  const descriptionHtml = md.renderInline(desc || '')

  function pre(code: string) {
    return code
      .replace(/\{\{/g, '&#123;&#123;')
      .replace(/\}\}/g, '&#125;&#125;')
  }

  const props
    = `typescript="${encodeURIComponent(typescript)}"\n`
      + `javascript="${encodeURIComponent(javascript)}"\n`
      + `typescriptHtml="${encodeURIComponent(typescriptHtml)}"\n`
      + `javascriptHtml="${encodeURIComponent(javascriptHtml)}"\n`
      + `:metadata='${JSON.stringify(metadata)}'\n`
      + `v-bind='${JSON.stringify(bindProps)}'\n`

  return {
    name,
    props,
    descriptionHtml,
    highlightedHtml,
    isUsingTS,
    typescript,
    javascript,
    typescriptHtml,
    javascriptHtml,
    template,
    type,
  }
}

export function generateDemoComponent(
  md: MarkdownRenderer,
  env: MarkdownEnv,
  options: GenerateOptions,
) {
  const { template, props, descriptionHtml, typescriptHtml, javascriptHtml } = parse(md, env, options)

  return trim(`
  <demo-container \n${props}>
    ${generateSfcSlots(typescriptHtml, javascriptHtml)}
    ${template}
    <template #md:description>
      ${descriptionHtml}
    </template>
  </demo-container>
  `)
}

export function generateDemoContainerPrefix(
  md: MarkdownRenderer,
  env: MarkdownEnv,
  options: GenerateOptions,
) {
  const { template, props, typescriptHtml, javascriptHtml } = parse(md, env, options)

  return trim(`
  <demo-container \n${props}>
    ${generateSfcSlots(typescriptHtml, javascriptHtml)}
    ${template}
    <template #md:description>
  `)
}

export function generateDemoContainerSuffix() {
  return trim(`
    </template>
  </demo-container>
  `)
}

export function generateSfcSlots(typescriptHtml?: string, javascriptHtml?: string) {
  return trim(`
    <template #md:typescript>
      <div class="language-vue" style="flex: 1;">
        ${typescriptHtml}
      </div>
    </template>
    <template #md:javascript>
      <div class="language-vue" style="flex: 1;">
        ${javascriptHtml}
      </div>
    </template>
  `)
}
