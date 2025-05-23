import { contextBridge, ipcRenderer } from 'electron'
import ChannelKey from '../ChannelKey.ts'

const tokenApi = {
  /**
   * @returns {Promise<string>} refresh_token
   */
  openLoginWindow: (autoClose = true) => {
    return ipcRenderer.invoke(ChannelKey.OPEN_LOGIN_WINDOW, autoClose) as Promise<string>
  },
  refreshAccessToken: (refreshToken: string) => {
    return ipcRenderer.invoke(ChannelKey.REFRESH_ACCESS_TOKEN, refreshToken) as Promise<{ accessToken: string; refreshToken: string }>
  },
}

declare global {
  interface Window {
    tokenApi: typeof tokenApi
  }
}

const loader = () => {
  contextBridge.exposeInMainWorld('tokenApi', tokenApi)
}
export default loader
