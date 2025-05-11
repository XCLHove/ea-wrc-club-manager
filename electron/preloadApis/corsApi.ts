import { contextBridge, ipcRenderer } from 'electron'
import ChannelKey from '../ChannelKey.ts'
import { AxiosRequestConfig } from 'axios'

const corsApi = () => {
  contextBridge.exposeInMainWorld('CORS', {
    axios: (config: AxiosRequestConfig): Promise<any> => {
      return ipcRenderer.invoke(ChannelKey.AXIOS, config)
    },
  })
}

export default corsApi
