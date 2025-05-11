import { contextBridge, ipcRenderer } from 'electron'
import ChannelKey from '../ChannelKey'

const systemApi = () => {
  contextBridge.exposeInMainWorld('systemApi', {
    openFolder: (path = '.') => {
      ipcRenderer.send(ChannelKey.OPEN_FOLDER, path)
    },
  })
}
export default systemApi
