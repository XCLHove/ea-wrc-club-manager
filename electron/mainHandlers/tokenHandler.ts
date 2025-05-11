import { ipcMain, session, BrowserWindow } from 'electron'
import ChannelKey from '../ChannelKey'
import axios from 'axios'

const refreshTokenCookieName = 'RACENET-REFRESH-TOKEN'
const apiUrl = 'https://web-api.racenet.com'
const tokenHandler = (win: BrowserWindow) => {
  session.defaultSession.cookies.addListener('changed', (_, cookie) => {
    if (cookie.name !== refreshTokenCookieName) return
    win?.webContents.send(ChannelKey.ON_CHANGE_REFRESH_TOKEN, cookie)
  })

  ipcMain.on(ChannelKey.REMOVE_REFRESH_TOKEN, async () => {
    await session.defaultSession.cookies.remove(apiUrl, refreshTokenCookieName)
  })

  ipcMain.handle(ChannelKey.REFRESH_TOKEN, async (_, refreshToken: string) => {
    return await axios
      .post(
        `${apiUrl}/api/identity/refresh-auth`,
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
        if (status !== 200) return {}
        const { access_token, refresh_token } = data
        return {
          accessToken: access_token,
          refreshToken: refresh_token,
        }
      })
  })
}
export default tokenHandler
