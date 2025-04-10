# vitepress-plugin-demo

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

## Features

- ✨ Use the `<demo>` or `container` in Markdown to reference a demo container.
- ♾️ Automatically convert TS code and provide JS demo code.
- 👽️ Support Vue, React, JS, TS and HTML demo block.
- 📝 Use Markdown syntax by you demo block description.
- 💡 Support [twoslash](https://shiki.style/packages/vitepress) syntax highlighting.
- 📦️ Supports multiple [presets](#presets), ready to use out of the box.
- 🎨 Customize the demo container to suit your needs.

***

`vitepress-plugin-demo` is a `markdown-it` plugin specifically designed for Vitepress demos. It converts code blocks in Markdown into references to the `<demo-container>` component. It does not generate UI itself but serves as a plugin for creating demo containers.

With this plugin, you can use the `<demo>` tag in Markdown to reference a demo container. For example:

```html
<demo src="../demo.vue" title="Demo block" description="use demo" />
```

You can use Markdown syntax in the `desc` field. For example:

```html
<demo src="../demo.vue" title="Demo block" description="use `demo` ..." />
```

However, we recommend using the `container` mode to write the `desc` content with Markdown:

```markdown
::: demo src="../demo.vue" title="Demo block"

This is a `description` that can be written using Markdown.

:::
```

This looks more aesthetically pleasing and adheres better to Markdown syntax.

In addition, you can pass the `attrs` parameter to `props`, so you can utilize the [Line Highlighting in Code Blocks](https://vitepress.dev/guide/markdown#line-highlighting-in-code-blocks) feature of VitePress:

```markdown
<demo src="../demo.vue" attributes="{1,4,6-8}" />
<demo src="../demo.vue" attributes="{4}" />
```

## Twoslash

`vitepress-plugin-demo` also supports [vitepress/twoslash](https://shiki.style/packages/vitepress) syntax highlighting. You can use the `twoslash` tag in Markdown to reference a demo container. For example:

```markdown
<demo src="../demo.vue" title="Demo block" description="use demo" twoslash />
```

## React

`vitepress-plugin-demo` also supports React demo blocks. You can use the `react` tag in Markdown to reference a demo container.

```sh
npm install react react-dom --save-dev
```

import your React component:

```markdown
<demo type="react" src="../demo.tsx" title="Demo block" description="use demo" />
```

## Install

```bash
npm install vitepress-plugin-demo --save-dev
```

## Usage

```js
import { demoMdPlugin } from 'vitepress-plugin-demo'
// .vitepress/config.js
export default defineConfig({
  markdown: {
    config(md) {
      md.use(demoMdPlugin)
    },
  },
})
```

Register your `<demo-container>` component in `theme/index.ts|js`:

```js
// https://vitepress.dev/guide/custom-theme
import Theme from 'vitepress/theme'

// your demo component
import CustomDemoContainer from './components/CustomDemoContainer.vue'

export default {
  ...Theme,
  enhanceApp({ app, router, siteData }) {
    app.component('demo-container', CustomDemoContainer)
  },
}
```

## Presets

`vitepress-plugin-demo` pre-set common component library themes, which you can directly use:

<details>
<summary>Naive UI</summary><br>

```sh
npm install vitepress-plugin-demo naive-ui --save-dev
```

```js
import TwoslashFloating from '@shikijs/vitepress-twoslash/client'
import NaiveUIContainer from 'vitepress-plugin-demo/client/naive-ui'
import '@shikijs/vitepress-twoslash/style.css'

export default {
  ...Theme,
  async enhanceApp({ app, router, siteData }) {
    if (!import.meta.env.SSR) {
      const { default: NaiveUI } = await import('naive-ui')
      app.use(NaiveUI)
    }
    app.use(TwoslashFloating)
    app.use(NaiveUIContainer, {
      github: 'you github blob url',
      codeeditor: {
        editor: ['stackblitz', 'codesandbox'],
        globals: {
          package: {/* ... */},
          files: {/* ... */},
          opens: ['App.vue']
        },
        resolve(props) {
          const code = props.tsCode || props.jsCode
          return { /* cover global config */ }
        }
      },
    })
  },
}
```

<br></details>

## Customs

The `demo-container` component will receive relevant information about the demo, and you need to implement the rendering of the demo:

```html
<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  tsCode: string
  // if using ts, jsCode will transform the to js
  jsCode: string
  title: string
  metadata: object
}>()

const sfcCode = computed(() => decodeURIComponent(props.tsCode || props.jsCode))
</script>

<template>
  <div>
    <div>{{ title }}</div>
    <!-- copy your demo source code -->
    <div @click="navigator.clipboard.writeText(sfcCode)"> Copy Code </div>
    <!-- The description is rendered in the desc slot -->
    <slot name="md:desc" />
    <!-- The demo is rendered in the default slot -->
    <slot />
    <!-- highlighted code for the demo -->
    <slot name="md:sfc-ts" />
    <!-- or -->
    <slot name="md:sfc-js" />
  </div>
</template>
```

Other `props` will not be processed and will be directly passed to the `<demo-container>` component. For example, you can customize whether the code is expanded using the `prop`:

```markdown
<demo src="../demo.vue" expand />
```

> however, it is important to note that `<demo>` is not strictly a component and cannot handle excessively complex custom `props`, such as `v-bind`.

```ts
const props = defineProps<{
  // ...
  expand: boolean
}>()
```

## Metadata

The `demo-container` component will receive relevant information about the demo. You can use the `metadata` to access and use this information within the demo:

```html
<script lang="ts" setup>
const props = defineProps<{
  tsCode: string
  jsCode: string
  title: string
  // metadata returns information about the demo during build (absolutePath, relativePath, fileName)
  metadata: object
}>()
const githubBlobUrl = 'https://www.github.com/.../tree/main/'
const githubPath = githubBlobUrl + props.metadata.relativePath

function toEditGithubDemoFile() {
  window.open(githubPath)
}
</script>
```

## CodeSandbox

You can define the parameters for CodeSandbox by using `codesandbox/lib/api/define` and create a sandbox environment by submitting them to the CodeSandbox API through a `<form>`:

```html
<script lang="ts" setup>
import { getParameters } from 'codesandbox/lib/api/define'

const props = defineProps<{
  tsCode: string
  jsCode: string
  // ...
}>()

// Compute the parameters for CodeSandbox
const parameters = computed(() => {
  return getParameters({
    files: {
      'package.json': {
        // specify your dependencies
        content: { dependencies: { vue: 'latest' } },
      },
      'index.html': { content: `<div id="app"></div>` },
      'App.vue': { content: decodeURIComponent(props.jsCode) },
      'src/main.js': { content: '...' },
    },
  })
})
</script>
<template>
  <!-- Form to submit the parameters to CodeSandbox -->
  <form action="https://codesandbox.io/api/v1/sandboxes/define" method="POST" target="_blank">
    <input type="hidden" name="parameters" :value="parameters">
    <button>Edit in CodeSandbox</button>
  </form>
</template>
```

## Development

```bash
pnpm install

# Run development server
pnpm dev

# Have fun!
pnpm play
```

> Unit tests are in progress, PRs welcome!

## Acknowledgements

This project draws inspiration from the following projects:

- [ruabick](https://github.com/dewfall123/ruabick)
- [vitepress-demo-preview](https://github.com/flingyp/vitepress-demo-preview)
- [create-vitepress-demo](https://github.com/bowencool/create-vitepress-demo)
- [naive-ui](https://github.com/tusen-ai/naive-ui)
- [element-plus](https://github.com/element-plus/element-plus)

## License

[MIT](./LICENSE) License © [Hairyf](https://github.com/hairyf)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/vitepress-plugin-demo?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/vitepress-plugin-demo
[npm-downloads-src]: https://img.shields.io/npm/dm/vitepress-plugin-demo?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/vitepress-plugin-demo
[bundle-src]: https://img.shields.io/bundlephobia/minzip/vitepress-plugin-demo?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=vitepress-plugin-demo
[license-src]: https://img.shields.io/github/license/hairyf/vitepress-plugin-demo.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hairyf/vitepress-plugin-demo/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/vitepress-plugin-demo
