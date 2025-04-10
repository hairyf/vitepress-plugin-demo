<script lang="ts" setup>
import type { Codeeditor } from 'codeeditor-kit'
import type { InstallComponent } from './components/InstallProvider'
import Container from './Container.vue'

const props = defineProps<{
  typescript: string
  // if using ts, javascript will transform the to js
  javascript: string
  metadata: Record<string, any>
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
