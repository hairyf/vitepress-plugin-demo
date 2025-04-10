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
  let jsCode = ''
  let tsCode = ''
  let jsHtml = ''
  let tsHtml = ''

  const metadata: Metadata = {
    absolutePath: path,
    relativePath: normalizePath(relative(process.cwd(), path)),
    fileName: path.split('/').pop() || '',
  }

  if (lang === 'vue') {
    tsCode = isUsingTS ? transformSfc(code, { lang: 'ts' }) : ''
    jsCode = transformSfc(code, { lang: 'js', fix: isUsingTS })
    tsHtml = isUsingTS ? pre(highlight(tsCode, lang, attr)) : ''
    jsHtml = pre(highlight!(jsCode, lang, jsAttr))
  }

  if (lang === 'html') {
    jsCode = code
    jsHtml = pre(highlight(code, lang, jsAttr))
  }

  if (lang === 'js') {
    jsCode = code
    jsHtml = pre(highlight(code, lang, jsAttr))
    injectImportStatement(env, undefined, path)
  }

  if (lang === 'ts') {
    tsCode = code
    tsHtml = pre(highlight(code, lang, attr))
    jsCode = format(tsToJs(tsCode), 'js')
    jsHtml = pre(highlight(jsCode, lang, jsAttr))
    const file = metadata.relativePath.replace(/\//g, '_').replace(/\.ts/, '.js')
    const dirpath = normalizePath(`${__dirname}/temp`)
    const filepath = normalizePath(`${dirpath}/${file}`)
    fs.existsSync(dirpath) || fs.mkdirSync(dirpath)
    fs.writeFileSync(filepath, jsCode)
    injectImportStatement(env, undefined, filepath)
  }

  if (lang === 'tsx') {
    tsCode = code
    tsHtml = pre(highlight(code, lang, attr))
    jsCode = format(tsToJs(tsCode, { loader: 'tsx', jsx: 'preserve' }), 'jsx')
    jsHtml = pre(highlight(jsCode, lang, jsAttr))
  }

  if (lang === 'jsx') {
    jsCode = code
    jsHtml = pre(highlight(code, lang, jsAttr))
  }

  const highlightedHtml = tsHtml || jsHtml
  const descriptionHtml = md.renderInline(desc || '')

  function pre(code: string) {
    return code
      .replace(/\{\{/g, '&#123;&#123;')
      .replace(/\}\}/g, '&#125;&#125;')
  }

  const props
    = `tsCode="${encodeURIComponent(tsCode)}"\n`
      + `jsCode="${encodeURIComponent(jsCode)}"\n`
      + `tsHtml="${encodeURIComponent(tsHtml)}"\n`
      + `jsHtml="${encodeURIComponent(jsHtml)}"\n`
      + `:metadata='${JSON.stringify(metadata)}'\n`
      + `v-bind='${JSON.stringify(bindProps)}'\n`

  return {
    name,
    props,
    descriptionHtml,
    highlightedHtml,
    isUsingTS,
    tsCode,
    jsCode,
    tsHtml,
    jsHtml,
    template,
    type,
  }
}

export function generateDemoComponent(
  md: MarkdownRenderer,
  env: MarkdownEnv,
  options: GenerateOptions,
) {
  const { template, props, descriptionHtml, tsHtml, jsHtml } = parse(md, env, options)

  return trim(`
  <demo-container \n${props}>
    ${generateSfcSlots(tsHtml, jsHtml)}
    ${template}
    <template #md:desc>
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
  const { template, props, tsHtml, jsHtml } = parse(md, env, options)

  return trim(`
  <demo-container \n${props}>
    ${generateSfcSlots(tsHtml, jsHtml)}
    ${template}
    <template #md:desc>
  `)
}

export function generateDemoContainerSuffix() {
  return trim(`
    </template>
  </demo-container>
  `)
}

export function generateSfcSlots(tsHtml?: string, jsHtml?: string) {
  return trim(`
    <template #md:sfc-ts>
      <div class="language-vue" style="flex: 1;">
        ${tsHtml}
      </div>
    </template>
    <template #md:sfc-js>
      <div class="language-vue" style="flex: 1;">
        ${jsHtml}
      </div>
    </template>
  `)
}
