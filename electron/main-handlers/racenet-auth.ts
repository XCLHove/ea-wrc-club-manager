import { ipcMain, session, Cookie, BrowserWindow } from 'electron'
import ChannelKey from '../ChannelKey'
import axios, { AxiosError } from 'axios'
import openDeveloperMode from './openDeveloperMode.ts'

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
  const urls = [racenetApiBaseUrl, 'https://racenet.com']
  const removeUrlCookies = (url: string) => {
    return session.defaultSession.cookies
      .get({
        url: url,
      })
      .then((cookies) => {
        return Promise.all(cookies.map((cookie) => session.defaultSession.cookies.remove(url, cookie.name)))
      })
  }
  return Promise.all(urls.map(removeUrlCookies))
}

/**
 * 1. 获取fid
 */
function getFid() {
  return axios
    .get('https://accounts.ea.com/connect/auth', {
      maxRedirects: 0,
      params: {
        client_id: 'RACENET_1_JS_WEB_APP',
        response_type: 'code',
        redirect_uri: 'https://racenet.com/oauthCallback',
      },
    })
    .then(() => {
      return Promise.reject(new Error('Failed to get fid'))
    })
    .catch((error) => {
      const location = error.response.headers['location']
      const url = new URL(location)
      const fid = url.searchParams.get('fid')
      if (!fid) return Promise.reject(new Error('Failed to get fid'))
      return fid
    })
}

/**
 * 2. 使用fid获取execution
 */
function getExecution(fid: string) {
  return axios
    .get('https://signin.ea.com/p/juno/login', {
      params: {
        fid: fid,
      },
      maxRedirects: 0,
    })
    .then(() => Promise.reject(new Error('Failed to get execution')))
    .catch((error: AxiosError) => {
      const response = error.response
      if (response?.status !== 302) return Promise.reject(new Error('Failed to get execution'))

      const location = response.headers['location']
      const url = new URL(`https://example.com${location}`)
      const execution = url.searchParams.get('execution')

      const cookie = response.headers['set-cookie']
      const cookieMap = parseCookieToMap(cookie)

      const result = {
        execution: execution as string,
        JSESSIONID: cookieMap.get('JSESSIONID') as string,
        'signin-cookie': cookieMap.get('signin-cookie') as string,
      }
      return result
    })
}

/**
 * 3. 使用email和password获取_nx_mpcid
 */
function getNxMpcidByEmail(
  email: string,
  password: string,
  { execution, JSESSIONID, 'signin-cookie': signinCookie }: { execution: string; JSESSIONID: string; 'signin-cookie': string },
  isTryAgain = false,
): Promise<string> {
  const data = {
    email: email,
    password: password,
    regionCode: 'CN',
    _eventId: 'submit',
    showAgeUp: true,
    thirdPartyCaptchaResponse: '',
    loginMethod: 'emailPassword',
    _rememberMe: 'off',
    rememberMe: 'off',
    cid: '',
  }
  const params = {
    execution,
    initref: 'https://accounts.ea.com:443/connect/auth?response_type=code',
    redirect_uri: 'https://racenet.com/oauthCallback',
    client_id: 'RACENET_1_JS_WEB_APP',
    response_type: 'code',
  }
  const headers = {
    Cookie: `JSESSIONID=${JSESSIONID};signin-cookie=${signinCookie}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  return axios
    .post('https://signin.ea.com/p/juno/login', data, {
      params,
      headers,
      maxRedirects: 0,
    })
    .then((response) => {
      const cookies = response.headers['set-cookie']
      const cookieMap = parseCookieToMap(cookies)
      const nxMpcid = cookieMap.get('_nx_mpcid')
      if (nxMpcid) return nxMpcid
      return Promise.reject(new Error('Failed to get _nx_mpcid'))
    })
    .catch(
      /**
       * @param error {AxiosError}
       */
      (error) => {
        const response = error.response
        if (response?.status !== 302) return Promise.reject(new Error('Failed to get _nx_mpcid'))

        const cookies = response.headers['set-cookie']
        const cookieMap = parseCookieToMap(cookies)
        const nxMpcid = cookieMap.get('_nx_mpcid')
        if (nxMpcid) return nxMpcid
        if (isTryAgain) return Promise.reject(new Error('Failed to get _nx_mpcid'))

        const location = response.headers['location']
        const url = new URL(`https://example.com${location}`)
        const newExecution = url.searchParams.get('execution') as string

        return getNxMpcidByEmail(email, password, { execution: newExecution, JSESSIONID, 'signin-cookie': signinCookie }, true)
      },
    )
}

/**
 * 4. 使用fid和_nx_mpcid获取code
 */
function getCode(fid: string, nxMpcid: string) {
  return axios
    .get('https://accounts.ea.com:443/connect/auth', {
      params: {
        response_type: 'code',
        redirect_uri: 'https://racenet.com/oauthCallback',
        client_id: 'RACENET_1_JS_WEB_APP',
        fid,
      },
      headers: {
        Cookie: `_nx_mpcid=${nxMpcid}`,
      },
      maxRedirects: 0,
    })
    .then(() => Promise.reject(new Error('Failed to get code')))
    .catch(
      /**
       * @param error {AxiosError}
       */
      (error) => {
        const response = error.response
        if (response?.status !== 302) return Promise.reject(new Error('Failed to get code'))
        const location = response.headers['location']
        const url = new URL(location)
        const code = url.searchParams.get('code')
        if (!code) return Promise.reject(new Error('Failed to get code'))
        return code
      },
    )
}

/**
 * 5. 使用code获取access_token和refresh_token
 */
function getAccessToken(code: string) {
  return axios
    .post('https://web-api.racenet.com/api/identity/auth', {
      authCode: code,
      clientId: 'RACENET_1_JS_WEB_APP',
      grantType: 'authorization_code',
      codeVerifier: '',
      redirectUri: 'https://racenet.com/oauthCallback',
      refreshToken: '',
    })
    .then((response) => {
      const data = response.data
      return {
        accessToken: data.access_token as string,
        refreshToken: data.refresh_token as string,
      }
    })
}

function parseCookieToMap(cookies?: string[]) {
  const cookieMap = new Map()
  cookies?.forEach((item) => {
    const [key, value] = item.substring(0, item.indexOf(';')).split('=')
    cookieMap.set(key, value)
  })
  return cookieMap
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
    let loginWindow: BrowserWindow
    openLoginWindowPromise = new Promise(async (resolve, reject) => {
      await removeRefreshTokenCookie().catch(reject)
      loginWindow = new BrowserWindow({ parent: win, modal: true, show: true })
      openDeveloperMode(loginWindow)
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

  ipcMain.handle(ChannelKey.LOGIN_BY_EMAIL, async (_event, { email, password }: { email: string; password: string }) => {
    const fid = await getFid()
    const executionData = await getExecution(fid)
    const nxMpcid = await getNxMpcidByEmail(email, password, executionData)
    const code = await getCode(fid, nxMpcid)
    const accessTokenData = await getAccessToken(code)
    return accessTokenData
  })
}
export default handler
