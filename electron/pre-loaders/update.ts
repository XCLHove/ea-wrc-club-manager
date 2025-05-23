import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import ChannelKey from '../ChannelKey.ts'

const updateApi = {
  quitAndInstall: (): Promise<void> => {
    return ipcRenderer.invoke(ChannelKey.INSTALL_UPDATE)
  },
  checkUpdate: (): Promise<UpdateInfo> => {
    return ipcRenderer.invoke(ChannelKey.CHECK_UPDATE)
  },
  downloadUpdate: (onProgress: (progress: { current: number; total: number }) => void, url?: string): Promise<void> => {
    const listener = (event: IpcRendererEvent, progressData: { current: number; total: number }) => {
      onProgress(progressData)
    }
    ipcRenderer.on(ChannelKey.DOWNLOAD_PROGRESS, listener)
    return ipcRenderer.invoke(ChannelKey.DOWNLOAD_UPDATE, url).finally(() => {
      ipcRenderer.off(ChannelKey.DOWNLOAD_PROGRESS, listener)
    })
  },
  cancelDownload: (message = '取消下载') => {
    return ipcRenderer.invoke(ChannelKey.CANCEL_DOWNLOAD, message)
  },
}

declare global {
  interface Window {
    updateApi: typeof updateApi
  }
}
const loader = () => {
  contextBridge.exposeInMainWorld('updateApi', updateApi)
}
export default loader
