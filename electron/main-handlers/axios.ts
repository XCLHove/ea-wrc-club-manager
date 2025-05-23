import { BrowserWindow, app, ipcMain } from 'electron'
import ChannelKey from '../ChannelKey.ts'
import axios, { AxiosRequestConfig } from 'axios'

const handler = (win: BrowserWindow) => {
  ipcMain.handle(ChannelKey.AXIOS, (_event, config: AxiosRequestConfig) => {
    return axios(config).then((response) => {
      return response.data
    })
  })
}

export default handler
