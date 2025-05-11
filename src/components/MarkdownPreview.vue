<script setup lang="ts">
import { ref, watch } from 'vue'
import Vditor from 'vditor'
import 'vditor/src/assets/less/index.less'
import { resolvePath } from '@/utils/pathUtil.ts'

type MarkdownPreviewProps = {
  content?: string
}
const props = withDefaults(defineProps<MarkdownPreviewProps>(), {})

const previewRef = ref<HTMLDivElement>()

watch(
  () => props.content,
  () => {
    renderPreview()
  },
)

let renderPromise: Promise<void> | null = null
function renderPreview(tryOnFailed = false) {
  if (!renderPromise || tryOnFailed) {
    renderPromise = new Promise<void>((resolve, reject) => {
      if (!previewRef.value) {
        setTimeout(() => {
          renderPreview(true).then(resolve).catch(reject)
        }, 100)
        return
      }

      Vditor.preview(previewRef.value, props.content || '', {
        cdn: resolvePath('cdn/vditor'),
        mode: 'dark',
      })
    })
    renderPromise.finally(() => {
      renderPromise = null
    })
  }
  return renderPromise
}
</script>

<template>
  <div>
    <div ref="previewRef"></div>
  </div>
</template>

<style scoped lang="less"></style>
