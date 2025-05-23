import { contextBridge, ipcRenderer } from 'electron'
import ChannelKey from '../ChannelKey.ts'
import { AxiosRequestConfig } from 'axios'

const CORS = {
  axios: (config: AxiosRequestConfig): Promise<any> => {
    return ipcRenderer.invoke(ChannelKey.AXIOS, config)
  },
}

declare global {
  interface Window {
    CORS: typeof CORS
  }
}

const loader = () => {
  contextBridge.exposeInMainWorld('CORS', CORS)
}
export default loader
