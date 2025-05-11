<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import axios from 'axios'
import { resolvePath } from '@/utils/pathUtil'
import MarkdownPreview from '@/components/MarkdownPreview.vue'

const readme = ref('')
const getReadme = () => {
  axios.get(resolvePath('readme.md')).then(({ data }) => {
    readme.value = data
  })
}
onMounted(getReadme)

const height = (() => {
  const { height } = useWindowSize()

  return computed(() => height.value - 75)
})()
</script>

<template>
  <!--<el-button @click="test">test</el-button>-->
  <div>
    <el-scrollbar :height="height">
      <MarkdownPreview :content="readme" />
    </el-scrollbar>
  </div>
</template>

<style lang="less" scoped></style>
