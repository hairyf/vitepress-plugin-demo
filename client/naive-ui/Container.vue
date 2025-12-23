<script lang="ts" setup>
import type { Codeeditor } from 'codeeditor-kit'
import type { InstallComponent } from './components/InstallProvider'
import { computed, getCurrentInstance, ref, watch } from 'vue'
import CopyCodeButton from './components/CopyCodeButton.vue'
import EditInCodeSandboxButton from './components/EditInCodeSandboxButton.vue'
import EditInGithubButton from './components/EditInGithubButton.vue'
import EditInStackblitzButton from './components/EditInStackblitzButton.vue'
import ExpandToggleButton from './components/ExpandToggleButton.vue'
import NaiveContainer from './components/NaiveContainer.vue'
import { i18n } from './composables'

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
  codeeditor?: Codeeditor
  install?: InstallComponent[]
}>()

const visible = ref(props.expand ?? false)

const { t } = i18n({
  'zh-CN': {
    show: '显示代码',
    hide: '收起代码',
    editInGithub: '在 GitHub 中编辑',
    editInCodeSandbox: '在 CodeSandbox 中编辑',
    editInStackblitz: '在 Stackblitz 中编辑',
    copyCode: '复制代码',
    copySuccess: '复制成功',
  },
  'en-US': {
    show: 'Show Code',
    hide: 'Hide Code',
    editInGithub: 'Edit on GitHub',
    editInCodeSandbox: 'Edit in CodeSandbox',
    editInStackblitz: 'Edit in Stackblitz',
    copyCode: 'Copy Code',
    copySuccess: 'Successfully Copied',
  },
})
const instance = getCurrentInstance()
const typescript = computed(() => decodeURIComponent(props.typescript))
const javascript = computed(() => decodeURIComponent(props.javascript))

const hasFiles = computed(() => props.files && props.files.length > 0)
const activeFileName = ref(props.files?.[0]?.name)

watch(() => props.files, (newFiles) => {
  if (newFiles && newFiles.length) {
    if (!activeFileName.value || !newFiles.find(f => f.name === activeFileName.value))
      activeFileName.value = newFiles[0].name
  }
})

const activeFile = computed(() => {
  return props.files?.find(f => f.name === activeFileName.value)
})

const isUsingTs = computed(() => {
  if (hasFiles.value && activeFile.value)
    return !!activeFile.value.typescript
  return !!props.typescript
})

const code = computed(() => {
  if (hasFiles.value && activeFile.value)
    return isUsingTs.value ? activeFile.value.typescript : activeFile.value.javascript

  return isUsingTs.value ? typescript.value : javascript.value
})

const showLanguage = ref(isUsingTs.value ? 'ts' : 'js')

// If switching files, reset showLanguage if current language is not available?
// For now, keep it simple. If TS is available, showLanguage defaults to 'ts' logic above is initial value.
// But we might need to watch activeFile to adjust showLanguage if needed.
watch(activeFile, () => {
  if (isUsingTs.value && showLanguage.value === 'js' && !activeFile.value?.javascript) {
    showLanguage.value = 'ts'
  }
  // If we switch to a file that is ONLY JS, isUsingTs will be false.
  // showLanguage might not matter as toggle is hidden.
})

const codeeditor = props.codeeditor || instance?.appContext.config.globalProperties.$codeeditor
const editors = codeeditor?.$editors || []
</script>

<template>
  <NaiveContainer :id="metadata.fileName" :install="install" :title="title">
    <template #header-extra>
      <EditInStackblitzButton
        v-if="editors.includes('stackblitz')"
        :tooltip="t('editInStackblitz')"
        @click="codeeditor?.open('stackblitz', { ...$props, code })"
      />
      <EditInCodeSandboxButton
        v-if="editors.includes('codesandbox')"
        :tooltip="t('editInCodeSandbox')"
        @click="codeeditor?.open('codesandbox', { ...$props, code })"
      />
      <EditInGithubButton
        v-if="github || $github"
        :relative-path="metadata.relativePath"
        :tooltip="t('editInGithub')"
        :github="github || $github"
      />
      <CopyCodeButton :code="code || ''" :success-text="t('copySuccess')" :tooltip="t('copyCode')" />
      <ExpandToggleButton :tooltip="!visible ? t('show') : t('hide')" @click="visible = !visible" />
    </template>
    <n-p v-if="$slots['md:description']" class="desc">
      <slot name="md:description" />
    </n-p>
    <slot />
    <template v-if="visible" #footer>
      <n-tabs
        v-if="isUsingTs" v-model:value="showLanguage" size="small" type="segment" style="padding: 12px 24px;"
        animated
      >
        <n-tab name="ts">
          TypeScript
        </n-tab>
        <n-tab name="js">
          JavaScript
        </n-tab>
      </n-tabs>

      <div v-if="hasFiles" class="files-tabs">
        <div class="files-tabs__spacer" />
        <n-tabs
          v-model:value="activeFileName"
          type="card"
          class="pb-0"
          size="small"
        >
          <n-tab v-for="file in files" :key="file.name" :name="file.name">
            {{ file.name }}
          </n-tab>
        </n-tabs>
      </div>
      <div v-if="hasFiles && activeFile" class="language-vue code-pane">
        <div v-if="showLanguage === 'ts' || !activeFile.javascript" v-html="decodeURIComponent(activeFile.typescriptHtml || activeFile.javascriptHtml || '')" />
        <div v-else v-html="decodeURIComponent(activeFile.javascriptHtml || '')" />
      </div>
      <template v-else>
        <slot v-if="showLanguage === 'ts'" name="md:typescript" />
        <slot v-else name="md:javascript" />
      </template>
    </template>
  </NaiveContainer>
</template>

<style>
.desc:not(:empty) {
  margin-bottom: 24px;
}

.demo-card .demo-card__view:not(:first-child) {
  margin-top: 16px;
}

.demo-card code.n-text {
  white-space: nowrap;
}

.demo-card .language-vue {
  margin: 0 !important;
  border-radius: 0 !important;

}
.files-tabs {
  padding: 0;
  display: flex;
}
.files-tabs__spacer {
  border-bottom: 1px solid var(--n-border-color);
  width: 24px;
}
.code-pane {
  flex: 1;
}
</style>
