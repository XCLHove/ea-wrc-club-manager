import { contextBridge, ipcRenderer } from 'electron'
import ChannelKey from '../ChannelKey'

const systemApi = {
  openFolder: (path = '.') => {
    ipcRenderer.send(ChannelKey.OPEN_FOLDER, path)
  },
}

declare global {
  interface Window {
    systemApi: typeof systemApi
  }
}

const loader = () => {
  contextBridge.exposeInMainWorld('systemApi', systemApi)
}
export default loader
