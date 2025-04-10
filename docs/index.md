---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Demo of Markdown"
  text: "In Vitepress"
  image: "/logo.svg"
  tagline: "Start your component development."
  actions:
    - theme: brand
      text: Get Started
      link: https://github.com/hairyf/vitepress-plugin-demo?tab=readme-ov-file#install
---

<demo
  title="Print Hello World By Vue"
  description="This is a simple example of a Vue component that prints 'Hello World' to the console."
  src="./index.vue"
  attributes="{5}"
  attributes-in-js="{4}"
  twoslash
  expand
/>

<demo
  title="Print Hello World By React"
  description="This is a simple example of a React component that prints 'Hello World' to the console."
  src="./index.tsx"
  type="react"
  expand
/>

<demo
  title="Print Hello World By HTML"
  description="This is a simple example of a html that prints 'Hello World' to the console."
  src="./index.html"
  attributes="{22}"
  expand
/>

<demo
  title="Print Hello World By Code"
  description="This is a simple example of a code that prints 'Hello World' to the console."
  src="./index.ts"
  attributes="{2}"
  js-attributes="{1}"
  twoslash
  expand
/>
