<!-- eslint-disable no-console -->
<script lang="ts" setup>
defineProps<{
  tsCode: string
  jsCode: string
  title: string
  metadata: object
  expand?: boolean
  a?: number
  b?: object
}>()
</script>

<template>
  <div>
    <h3 style="margin-bottom: 20px;">
      {{ title }}
    </h3>
    <!-- The demo is rendered in the default slot -->
    <slot />
    <!-- Highlighted code for the demo -->
    <div>
      <slot name="md:typescript" />
      <slot name="md:javascript" />
    </div>
    <slot name="md:description" />
  </div>
</template>
