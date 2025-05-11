import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import localStorageRef from '@/composables/localStorageRef.ts'

const useUpdateStore = defineStore('updateStore', () => {
  const updateInfo = ref<UpdateInfo>()
  const downloadUrlList = computed<DownloadUrl[]>(() => {
    if (!updateInfo.value) return []
    return updateInfo.value?.downloadUrl || []
  })
  const updateAvailable = computed(() => {
    return updateInfo.value?.available || false
  })
  const downloadProgressCurrent = ref(0)
  const downloadProgressTotal = ref(0)
  const downloadProgressPercentage = computed(() => {
    if (downloadProgressCurrent.value === 0) {
      return 0
    }
    if (downloadProgressTotal.value === 0) {
      return 0
    }
    return parseInt(((downloadProgressCurrent.value / downloadProgressTotal.value) * 100).toFixed(2))
  })
  const downloaded = ref(false)
  const downloading = ref(false)
  const currentVersion = localStorageRef('unknown', 'currentVersion')

  async function checkUpdate() {
    const info = await window.updateApi.checkUpdate()
    updateInfo.value = info
    return info
  }

  async function downloadUpdate(url?: string) {
    if (downloading.value) {
      ElMessage.warning('正在下载更新，请勿重复操作')
      return
    }
    if (downloaded.value) {
      ElMessage.success('已下载')
    }
    downloading.value = true
    await window.updateApi
      .downloadUpdate((progress) => {
        downloadProgressCurrent.value = progress.current
        downloadProgressTotal.value = progress.total
      }, url)
      .then(() => {
        downloaded.value = true
      })
      .finally(() => {
        downloading.value = false
      })
  }

  async function install() {
    await window.updateApi.quitAndInstall()
  }

  return {
    updateInfo: computed(() => updateInfo.value),
    downloadUrlList: computed(() => downloadUrlList.value),
    updateAvailable: computed(() => updateAvailable.value),
    downloadProgressCurrent: computed(() => downloadProgressCurrent.value),
    downloadProgressTotal: computed(() => downloadProgressTotal.value),
    downloadProgressPercentage: computed(() => downloadProgressPercentage.value),
    downloaded: computed(() => downloaded.value),
    downloading: computed(() => downloading.value),
    currentVersion: computed(() => currentVersion.value),
    checkUpdate,
    downloadUpdate,
    install,
  }
})

export default useUpdateStore
