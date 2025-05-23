import { ipcMain, session, BrowserWindow } from 'electron'
import ChannelKey from '../ChannelKey'
import axios from 'axios'

export const refreshTokenCookieName = 'RACENET-REFRESH-TOKEN'
export const racenetApiBaseUrl = 'https://web-api.racenet.com'

export function onRefreshTokenChanged(callback: (refreshToken: string) => void, once = false) {
  const listener: Parameters<typeof session.defaultSession.cookies.addListener>[1] = (_, cookie) => {
    if (cookie.name !== refreshTokenCookieName) return
    const refreshToken = cookie.value
    if (!refreshToken) return
    if (once) removeListener()
    callback(refreshToken)
  }
  let removeListener = () => {
    session.defaultSession.cookies.removeListener('changed', listener)
    removeListener = () => {}
  }
  session.defaultSession.cookies.addListener('changed', listener)
  return removeListener
}

export function removeRefreshTokenCookie() {
  return session.defaultSession.cookies.remove(racenetApiBaseUrl, refreshTokenCookieName)
}

const handler = (win: BrowserWindow) => {
  // 刷新访问令牌
  ipcMain.handle(ChannelKey.REFRESH_ACCESS_TOKEN, async (_, refreshToken: string) => {
    return await axios
      .post(
        `${racenetApiBaseUrl}/api/identity/refresh-auth`,
        {
          redirectUri: 'https://racenet.com/oauthCallback',
          clientId: 'RACENET_1_JS_WEB_APP',
          grantType: 'refresh_token',
        },
        {
          headers: {
            Cookie: `${refreshTokenCookieName}=${refreshToken}`,
            Origin: 'https://racenet.com',
            Referer: 'https://racenet.com/',
          },
        },
      )
      .then(({ data, status }) => {
        if (status !== 200) return Promise.reject(new Error('Refresh token failed'))
        const { access_token, refresh_token } = data
        return {
          accessToken: access_token,
          refreshToken: refresh_token,
        }
      })
  })

  // 打开登录窗口
  let openLoginWindowPromise: Promise<string> | null = null
  ipcMain.handle(ChannelKey.OPEN_LOGIN_WINDOW, (_event, autoClose = true) => {
    if (openLoginWindowPromise) return openLoginWindowPromise
    const loginWindow = new BrowserWindow({ parent: win, modal: true, show: true })
    openLoginWindowPromise = new Promise(async (resolve, reject) => {
      await removeRefreshTokenCookie().catch(reject)
      onRefreshTokenChanged((refreshToken) => {
        resolve(refreshToken)
      }, true)
      loginWindow.loadURL('https://racenet.com')
      loginWindow.on('close', () => {
        reject(new Error('cancel login'))
      })
    })
    openLoginWindowPromise.finally(() => {
      openLoginWindowPromise = null
      if (autoClose) loginWindow.close()
    })
    return openLoginWindowPromise
  })
}
export default handler
