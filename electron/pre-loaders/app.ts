import { contextBridge, ipcRenderer } from 'electron'
import ChannelKey from '../ChannelKey.ts'

const appApi = {
  getVersion: (): Promise<string> => {
    return ipcRenderer.invoke(ChannelKey.GET_VERSION)
  },
}

declare global {
  interface Window {
    appApi: typeof appApi
  }
}

const loader = () => {
  contextBridge.exposeInMainWorld('appApi', appApi)
}
export default loader
