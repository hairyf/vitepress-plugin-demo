<script lang="ts" setup>
import type { Codeeditor } from 'codeeditor-kit'
import type { InstallComponent } from './components/InstallProvider'
import { computed, getCurrentInstance, ref } from 'vue'
import CopyCodeButton from './components/CopyCodeButton.vue'
import EditInCodeSandboxButton from './components/EditInCodeSandboxButton.vue'
import EditInGithubButton from './components/EditInGithubButton.vue'
import EditInStackblitzButton from './components/EditInStackblitzButton.vue'
import ExpandToggleButton from './components/ExpandToggleButton.vue'
import NaiveContainer from './components/NaiveContainer.vue'
import { i18n } from './composables'

const props = defineProps<{
  typescript: string
  // if using ts, javascript will transform the to js
  javascript: string
  metadata: Record<string, any>
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

const isUsingTs = computed(() => !!props.typescript)

const code = computed(() => isUsingTs.value ? typescript.value : javascript.value)

const showLanguage = ref(isUsingTs.value ? 'ts' : 'js')

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
      <CopyCodeButton :code="code" :success-text="t('copySuccess')" :tooltip="t('copyCode')" />
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

      <slot v-if="showLanguage === 'ts'" name="md:typescript" />
      <slot v-else name="md:javascript" />
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
</style>
