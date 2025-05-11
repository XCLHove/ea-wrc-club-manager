import { BrowserWindow, app, ipcMain } from 'electron'
import ChannelKey from '../ChannelKey.ts'

const handlerGetVersion = (win: BrowserWindow) => {
  ipcMain.handle(ChannelKey.GET_VERSION, () => {
    return app.getVersion()
  })
}

export default handlerGetVersion
