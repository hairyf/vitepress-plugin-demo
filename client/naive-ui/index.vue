<script lang="ts" setup>
import type { Codeeditor } from 'codeeditor-kit'
import type { InstallComponent } from './components/InstallProvider'
import Container from './Container.vue'

interface FileItem {
  name: string
  typescript?: string
  javascript?: string
  typescriptHtml?: string
  javascriptHtml?: string
}

const props = defineProps<{
  typescript: string
  // if using ts, javascript will transform the to js
  javascript: string
  metadata: Record<string, any>
  files?: FileItem[]
  title: string
  expand?: boolean
  github?: string
  install?: InstallComponent[]
  codeeditor?: Codeeditor
}>()
</script>

<template>
  <ClientOnly>
    <Container v-bind="props">
      <template v-for="(slot, key) in $slots" #[key]>
        <slot :name="key" />
      </template>
    </Container>
  </ClientOnly>
</template>
