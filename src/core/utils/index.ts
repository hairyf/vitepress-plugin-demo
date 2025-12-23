import type { AttributeNode, ElementNode } from '@vue/compiler-core'
import { baseParse } from '@vue/compiler-core'

function camelCase(str: string) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

function getPropsMappings(attrs: any[]) {
  const map: Record<string, any> = {}
  for (const { name, value, exp, arg } of attrs) {
    if (name === 'bind') {
      if (!isUndefined(arg?.content)) {
        try {
          // eslint-disable-next-line no-new-func
          map[arg.content] = new Function(`return ${exp.content}`)()
        }
        catch {
          try {
            map[arg.content] = JSON.parse(exp.content)
          }
          catch {
            console.warn(`[vitepress-plugin-demo] failed to parse props '${arg.content}' with value '${exp.content}'`)
          }
        }
      }
      continue
    }
    if (isUndefined(value?.content) || value?.content === '')
      map[name] = true
    else if (['true', 'false'].includes(value?.content || ''))
      map[name] = value?.content === 'true'
    else
      map[name] = value?.content
  }
  return map
}

export function parseProps(content: string) {
  const element = baseParse(content).children[0] as ElementNode
  const props = getPropsMappings(element.props as AttributeNode[])

  const camelCaseProps: Record<string, any> = {}
  for (const key in props) {
    camelCaseProps[camelCase(key)] = props[key]
  }
  return camelCaseProps
}

export function isUndefined(v: any): v is undefined {
  return v === undefined || v === null
}
