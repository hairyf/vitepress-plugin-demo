import { describe, expect, it } from 'vitest'
import { parseProps } from '../src/core/utils'

describe('props', () => {
  it('parse-base', () => {
    const props = parseProps('<demo src="./index.vue" title="Demo block - 2" />')
    expect(props).toEqual({
      src: './index.vue',
      title: 'Demo block - 2',
    })
  })

  it('parse-boolean', () => {
    const props = parseProps('<demo expand />')
    expect(props).toEqual({
      expand: true,
    })
  })
  it('parse-bind', () => {
    const props = parseProps('<demo :expand="true" />')
    expect(props).toEqual({
      expand: true,
    })
  })

  it('parse-array-single-quote', () => {
    const props = parseProps(`<demo :files="['./index.vue', './index.ts']" />`)
    expect(props).toEqual({
      files: ['./index.vue', './index.ts'],
    })
  })
})
