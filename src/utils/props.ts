import type { AttributeNode, ElementNode } from '@vue/compiler-core'
import { baseParse } from '@vue/compiler-core'
import { isUndefined } from './util'

function getPropsMap(attrs: any[]) {
  const map: Record<string, string | boolean | undefined> = {}
  for (const { name, value, exp, arg } of attrs) {
    if (name === 'bind') {
      if (!isUndefined(arg?.content))
        map[arg.content] = JSON.parse(exp.content)
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
  const ast = baseParse(content)
  const demoElement = ast.children[0] as ElementNode

  return getPropsMap(demoElement.props as AttributeNode[])
}
