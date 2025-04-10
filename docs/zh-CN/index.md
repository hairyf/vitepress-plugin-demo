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
  title="输出 Hello World"
  description="这是一个将“Hello World”打印到控制台的Vue组件的简单示例。"
  src="../index.vue"
  attributes="{5}"
  attributes-in-js="{4}"
  twoslash
  expand
/>
