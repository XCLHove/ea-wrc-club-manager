<script setup lang="ts">
import useUpdateStore from '@/stores/useUpdateStore'
import { dayjs, ElMessage } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useClipboard, useWindowSize } from '@vueuse/core'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import axios from 'axios'
import { resolvePath } from '@/utils/pathUtil.ts'
import CORSAxios from '@/utils/CORSAxios.ts'

const updateStore = useUpdateStore()
const { downloadUrlList } = storeToRefs(updateStore)
const downloadUrl = ref('')
watch(
  () => downloadUrlList.value,
  () => {
    if (downloadUrlList.value.length < 1) return
    downloadUrl.value = downloadUrlList.value[0].url
  },
  {
    immediate: true,
  },
)

const { copy } = useClipboard()
const { height: windowHeight } = useWindowSize()

const updateLog = ref('')
watch(
  () => updateStore.updateInfo,
  (info) => {
    if (!info) return
    getUpdateLog(info.description)
  },
  {
    immediate: true,
  },
)

function install() {
  updateStore.install().catch((e) => {
    ElMessage.error('启动安装程序失败：' + e.message)
  })
}

function download() {
  updateStore
    .downloadUpdate(downloadUrl.value)
    .then(() => {
      ElMessage.success('下载成功！')
    })
    .catch((e) => {
      ElMessage.error('下载失败：' + e)
    })
}

function cancelDownload(message = '取消下载') {
  window.updateApi.cancelDownload(message)
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function formatPercentageText(percentage: number) {
  return `${formatBytes(updateStore.downloadProgressCurrent)}/${formatBytes(updateStore.downloadProgressTotal)} (${percentage}%)`
}

function copyDownloadUrl(url: string) {
  copy(url).then(() => {
    ElMessage.success('下载地址已复制到剪贴板')
  })
}

function getUpdateLog(url: string) {
  CORSAxios({
    url: url,
    method: 'get',
    timeout: 10 * 1000,
  })
    .then((data) => {
      console.log(data)
      updateLog.value = data
    })
    .catch((e) => {
      ElMessage.error('获取更新日志失败：' + e)
    })
}
</script>

<template>
  <div class="update-page w-full h-full flex flex-col">
    <el-descriptions :column="1" border direction="vertical">
      <el-descriptions-item label="版本">
        {{ updateStore.updateInfo?.version || 'unknown' }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ updateStore.updateInfo?.updateTime ? dayjs(updateStore.updateInfo.updateTime).format('YYYY-MM-DD HH:mm:ss') : 'unknown' }}
      </el-descriptions-item>
      <el-descriptions-item label="下载地址">
        <el-tooltip effect="light" content="点击复制下载地址" placement="top">
          <el-button link @click="copyDownloadUrl(downloadUrl)">
            <div style="white-space: normal; overflow: hidden; text-overflow: ellipsis; width: 100%">
              {{ downloadUrl || 'unknown' }}
            </div>
          </el-button>
        </el-tooltip>
      </el-descriptions-item>
      <el-descriptions-item label="更新日志">
        <el-scrollbar :height="windowHeight - 485">
          <MarkdownPreview :content="updateLog" />
        </el-scrollbar>
      </el-descriptions-item>
    </el-descriptions>

    <div class="mt-auto flex flex-col">
      <div class="m-1" v-show="updateStore.downloading">
        <el-progress
          class="w-full"
          :text-inside="true"
          :stroke-width="26"
          :percentage="updateStore.downloadProgressPercentage"
          :format="formatPercentageText"
        />
      </div>
      <div class="m-1">
        <div class="w-full" v-show="!updateStore.updateAvailable">
          <el-button class="w-full" type="primary" @click="updateStore.checkUpdate()">检查更新</el-button>
        </div>
        <div class="w-full" v-show="updateStore.updateAvailable">
          <div v-show="!updateStore.downloaded" class="flex flex-row">
            <el-select v-model="downloadUrl" placeholder="请选择下载链接">
              <el-option v-for="item in updateStore.downloadUrlList" :key="item.url" :label="item.name" :value="item.url"></el-option>
            </el-select>
            <el-button v-show="!updateStore.downloading" type="primary" @click="download()" :disabled="updateStore.downloading">下载更新</el-button>
            <el-button v-show="updateStore.downloading" type="warning" @click="cancelDownload()">取消下载</el-button>
          </div>
          <el-button class="w-full" v-show="updateStore.downloaded" type="primary" @click="install()">退出并安装</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import '@/assets/css/flex.css';
@import '@/assets/css/margin.css';

.update-page {
}
</style>
