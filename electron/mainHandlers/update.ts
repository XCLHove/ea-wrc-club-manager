import { BrowserWindow, ipcMain, app } from 'electron'
import axios, { Canceler } from 'axios'
import path from 'node:path'
import * as os from 'os'
import * as fs from 'fs'
import * as child_process from 'child_process'
import ChannelKey from '../ChannelKey.ts'

function getUpdateUrl(): Promise<string[]> {
  const url = [
    'http://localhost:28000/update/latest.json',
    'https://gitee.com/xclhove/ea-wrc-club-manager/releases/download/latest/latest.json',
    'https://github.com/xclhove/ea-wrc-club-manager/releases/latest/download/latest.json',
  ]

  return Promise.resolve(url)
}

const update = (win: BrowserWindow) => {
  ipcMain.handle(ChannelKey.CHECK_UPDATE, () => {
    return checkUpdate()
  })
  ipcMain.handle(ChannelKey.DOWNLOAD_UPDATE, (_event, updateUrl?: string) => {
    return downloadUpdate(updateUrl)
  })
  ipcMain.handle(ChannelKey.INSTALL_UPDATE, () => {
    return quitAndInstall()
  })
  ipcMain.handle(ChannelKey.CANCEL_DOWNLOAD, (event, message?: string) => {
    cancelDownload?.(message)
  })

  let updateInfo: UpdateInfo | null = null
  let cancelDownload: Canceler

  async function checkUpdate() {
    const updateUrl = await getUpdateUrl()
    for (let i = 0; i < updateUrl.length; i++) {
      const url = updateUrl[i]
      try {
        const data = await axios
          .get(url, {
            timeout: 10 * 1000,
          })
          .then((res) => res.data)
          .then((data: Pick<UpdateInfo, 'version' | 'description' | 'updateTime' | 'downloadUrl' | 'file'>) => data)
        if (typeof data !== 'object') {
          return Promise.reject(new Error('update info is not valid'))
        }
        updateInfo = {
          ...data,
          available: data.version !== app.getVersion(),
          downloadUrl: data.downloadUrl.filter((item) => {
            if (import.meta.env.DEV) return true
            return item.name !== 'dev'
          }),
        }
        if (!updateInfo.available) {
          clearInstaller(data.file)
        }
        return updateInfo
      } catch (error) {
        if (i !== updateUrl.length - 1) continue
        return Promise.reject(error)
      }
    }
    return Promise.reject(new Error('There are no updates available'))
  }

  function getInstallerPath(filename: string) {
    const savePath = path.join(os.homedir(), 'AppData', 'Local', 'ea-wrc-club-manager', 'update', filename)
    return savePath
  }

  async function downloadUpdate(downloadUrl?: string) {
    if (!updateInfo) {
      updateInfo = await checkUpdate()
    }
    if (!updateInfo?.available) return Promise.reject(new Error('There are no updates available'))

    downloadUrl ||= updateInfo.downloadUrl[0].url
    console.log(`downloadUrl: ${downloadUrl}`)

    const savePath = getInstallerPath(updateInfo.file)
    const dir = path.dirname(savePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    return new Promise((resolve, reject) => {
      axios({
        method: 'get',
        url: downloadUrl || updateInfo!.downloadUrl[0].url,
        responseType: 'stream',
        timeout: 10 * 60 * 1000,
        onDownloadProgress(progressEvent) {
          win.webContents.send(ChannelKey.DOWNLOAD_PROGRESS, {
            current: progressEvent.loaded,
            total: progressEvent.total,
          })
        },
        cancelToken: new axios.CancelToken((cancel) => {
          cancelDownload = (message, config, request) => {
            reject(message)
            return cancel(message, config, request)
          }
        }),
      })
        .then((response) => {
          const writer = fs.createWriteStream(savePath)
          response.data.pipe(writer)
          const saveFilePromise = new Promise<void>((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
          })
          saveFilePromise.finally(() => writer.close())
          return saveFilePromise
        })
        .then(resolve)
        .catch(reject)
    })
  }

  async function quitAndInstall() {
    if (!updateInfo) {
      updateInfo = await checkUpdate()
    }
    if (!updateInfo.available) return Promise.reject(new Error('There are no updates available'))
    const installerPath = getInstallerPath(updateInfo.file)
    if (!fs.existsSync(installerPath)) return Promise.reject(new Error(`installer not found: ${installerPath}`))
    const child = child_process.spawn(installerPath, [], {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    app.quit()
  }

  function clearInstaller(filename: string) {
    const installer = getInstallerPath(filename)
    fs.rmSync(installer, { force: true })
  }
}

export default update
