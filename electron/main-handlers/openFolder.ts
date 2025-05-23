import { app, ipcMain, shell } from 'electron'
import ChannelKey from '../ChannelKey'
import Path from 'path'

const handler = () => {
  ipcMain.on(ChannelKey.OPEN_FOLDER, (_, path = '.') => {
    path = Path.join(app.getAppPath().replace('app.asar', ''), path)
    shell.openPath(path)
  })
}

export default handler
