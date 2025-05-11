import { contextBridge, ipcRenderer } from 'electron'
import ChannelKey from '../ChannelKey.ts'

const appApi = () => {
  contextBridge.exposeInMainWorld('appApi', {
    getVersion: (): Promise<string> => {
      return ipcRenderer.invoke(ChannelKey.GET_VERSION)
    },
  })
}

export default appApi
