import { BrowserWindow, ipcMain, app } from 'electron'
import axios, { Canceler } from 'axios'
import path from 'node:path'
import * as os from 'os'
import * as fs from 'fs'
import * as child_process from 'child_process'
import ChannelKey from '../ChannelKey.ts'
import throttle from '../utils/throttle.ts'

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
  ipcMain.handle(ChannelKey.DOWNLOAD_UPDATE, (_event, url: string, chunkNumber = 8) => {
    return downloadUpdate(url, chunkNumber)
  })
  ipcMain.handle(ChannelKey.INSTALL_UPDATE, () => {
    return quitAndInstall()
  })
  ipcMain.handle(ChannelKey.CANCEL_DOWNLOAD, (_event, message = 'cancel download') => {
    cancelerList.forEach((cancel) => cancel(message))
  })

  let updateInfo: UpdateInfo | null = null
  let cancelerList: Canceler[] = []

  async function checkUpdate() {
    const updateUrl = await getUpdateUrl()
    for (let i = 0; i < updateUrl.length; i++) {
      const url = updateUrl[i]
      try {
        const data = await axios
          .get(url)
          .then((res) => res.data)
          .then((data: Pick<UpdateInfo, 'version' | 'description' | 'updateTime' | 'downloadUrl' | 'file'>) => {
            if (typeof data !== 'object') {
              return Promise.reject(new Error('update info is not valid'))
            }
            return data
          })
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

  function downloadUpdate(downloadUrl: string, chunkNumber = 8) {
    if (!updateInfo?.available) return Promise.reject(new Error('There are no updates available'))

    const installerPath = getInstallerPath(updateInfo.file)
    const parentDir = path.dirname(installerPath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }

    return axios.head(downloadUrl).then((response) => {
      const totalSize = parseInt(response.headers['content-length'])
      const chunkSize = Math.ceil(totalSize / chunkNumber)
      let currentDownloadedSize = 0
      const sendProgress = throttle(() => {
        win.webContents.send(ChannelKey.DOWNLOAD_PROGRESS, {
          current: currentDownloadedSize,
          total: totalSize,
        })
      }, 100)

      const promises = Array.from({ length: chunkNumber }).map((_, index) => {
        const start = index * chunkSize
        const end = Math.min(start + chunkSize, totalSize) - 1

        const promise = new Promise<void>((resolve, reject) => {
          fs.writeFileSync(installerPath, '')
          const writerStream = fs.createWriteStream(installerPath, { start })
          writerStream.on('finish', () => resolve())
          axios
            .get(downloadUrl, {
              responseType: 'stream',
              headers: {
                Range: `bytes=${start}-${end}`,
              },
              cancelToken: new axios.CancelToken((cancel) => {
                cancelerList.push((...args: any[]) => {
                  cancel(...args)
                  cancel = () => {}
                  reject(new Error('cancel download'))
                  writerStream.close()
                })
              }),
            })
            .then((response) => {
              response.data.on('data', (chunk: any) => {
                currentDownloadedSize += chunk.length
                sendProgress()
              })
              response.data.pipe(writerStream)
            })
            .catch(reject)
        })
        return promise
      })
      return Promise.all(promises).catch((error) => {
        cancelerList.forEach((cancel) => cancel())
        cancelerList = []
        console.error(error)
        return Promise.reject(error)
      })
    })
  }

  function quitAndInstall() {
    if (!updateInfo?.available) return Promise.reject(new Error('There are no updates available'))
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
