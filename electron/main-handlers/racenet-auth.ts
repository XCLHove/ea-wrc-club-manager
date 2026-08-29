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
 * EA 设备信任凭证：登录成功后从 accounts.ea.com 的 set-cookie 中收集，
 * 下次登录时带上可静默认证（免密码、免 2FA，绕过 signin.ea.com 风控）
 */
export type EaDeviceCookies = { remid?: string; sid?: string; _nx_mpcid?: string }

function parseEaDeviceCookies(setCookies: string[] | undefined): EaDeviceCookies | undefined {
  const result: EaDeviceCookies = {}
  for (const item of setCookies || []) {
    const end = item.indexOf(';') === -1 ? item.length : item.indexOf(';')
    const pair = item.substring(0, end)
    const idx = pair.indexOf('=')
    const name = pair.substring(0, idx).trim()
    if (name === 'remid' || name === 'sid' || name === '_nx_mpcid') {
      const value = pair.substring(idx + 1)
      if (value) result[name] = value
    }
  }
  return Object.keys(result).length ? result : undefined
}

/**
 * 1. 获取fid（带上设备信任凭证时，EA 可直接静默下发 code）
 */
type FidResult = { type: 'silent'; silentCode: string; eaDeviceCookies?: EaDeviceCookies } | { type: 'fid'; fid: string }

function getFid(eaDeviceCookies?: EaDeviceCookies): Promise<FidResult> {
  const cookie = Object.entries(eaDeviceCookies || {})
    .map(([k, v]) => `${k}=${v}`)
    .join(';')
  return axios
    .get('https://accounts.ea.com/connect/auth', {
      maxRedirects: 0,
      params: {
        client_id: 'RACENET_1_JS_WEB_APP',
        response_type: 'code',
        redirect_uri: 'https://racenet.com/oauthCallback',
      },
      headers: cookie ? { Cookie: cookie } : {},
    })
    .then(() => {
      return Promise.reject(new Error('Failed to get fid'))
    })
    .catch(async (error): Promise<FidResult> => {
      const location: string = error.response.headers['location']
      const url = new URL(location, 'https://accounts.ea.com')
      // 静默认证：设备受信任时直接下发 code，无需密码
      const silentCode = url.searchParams.get('code')
      if (silentCode) return { type: 'silent', silentCode, eaDeviceCookies: parseEaDeviceCookies(error.response.headers['set-cookie']) }
      const fid = url.searchParams.get('fid')
      if (!fid) return Promise.reject(new Error('Failed to get fid'))
      return { type: 'fid', fid }
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
 * 3. 提交邮箱密码登录：返回 _nx_mpcid（未触发风控），
 *    或返回 2FA 挑战的 execution（EA 风控要求双重验证，常见于国内 IP）
 */
type CredentialsResult =
  | { type: 'success'; nxMpcid: string }
  | { type: '2fa'; execution: string; cookies: Record<string, string> }

function submitCredentials(
  email: string,
  password: string,
  { execution, JSESSIONID, 'signin-cookie': signinCookie }: { execution: string; JSESSIONID: string; 'signin-cookie': string },
  isTryAgain = false,
): Promise<CredentialsResult> {
  const count = isTryAgain ? 2 : 1
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
      const nxMpcid = parseCookieToMap(response.headers['set-cookie']).get('_nx_mpcid')
      if (nxMpcid) return { type: 'success' as const, nxMpcid }
      return Promise.reject(new Error(`[${count}][1]Failed to get _nx_mpcid`))
    })
    .catch(
      /**
       * @param error {AxiosError}
       */
      (error) => {
        const response = error.response
        if (response?.status !== 302) return Promise.reject(new Error(`[${count}][2]Failed to get _nx_mpcid`))

        const cookies = response.headers['set-cookie']
        const cookieMap = parseCookieToMap(cookies)
        const nxMpcid = cookieMap.get('_nx_mpcid')
        if (nxMpcid) return { type: 'success' as const, nxMpcid }
        if (isTryAgain) {
          // 重试后仍为 302：EA 风控要求双重验证（2FA），重定向到验证码挑战页
          const location = response.headers['location']
          const url = new URL(`https://example.com${location}`)
          const execution = url.searchParams.get('execution')
          if (!execution) return Promise.reject(new Error(`[${count}][3]Failed to get _nx_mpcid`))
          return {
            type: '2fa' as const,
            execution,
            cookies: { JSESSIONID, 'signin-cookie': signinCookie, ...Object.fromEntries(cookieMap) },
          }
        }

        const location = response.headers['location']
        const url = new URL(`https://example.com${location}`)
        const newExecution = url.searchParams.get('execution') as string

        return submitCredentials(email, password, { execution: newExecution, JSESSIONID, 'signin-cookie': signinCookie }, true)
      },
    )
}

/**
 * 4. 使用fid和_nx_mpcid获取code（响应的 set-cookie 中含设备信任凭证，需持久化）
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
        return { code, eaDeviceCookies: parseEaDeviceCookies(response.headers['set-cookie']) }
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

function cookieHeader(cookies: Record<string, string>) {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join(';')
}

/** 合并 set-cookie 到 cookie 对象（空值视为删除），返回合并结果 */
function mergeCookiesInto(cookies: Record<string, string>, setCookies?: string[]): Record<string, string> {
  const merged = { ...cookies }
  for (const item of setCookies || []) {
    const end = item.indexOf(';') === -1 ? item.length : item.indexOf(';')
    const pair = item.substring(0, end)
    const idx = pair.indexOf('=')
    const name = pair.substring(0, idx).trim()
    const value = pair.substring(idx + 1)
    if (!value) delete merged[name]
    else merged[name] = value
  }
  return merged
}

const JUNO_PARAMS = {
  initref: 'https://accounts.ea.com:443/connect/auth?response_type=code',
  redirect_uri: 'https://racenet.com/oauthCallback',
  client_id: 'RACENET_1_JS_WEB_APP',
  response_type: 'code',
}

type JunoEventResult =
  | { type: 'ok'; execution: string; location: string; cookies: Record<string, string> }
  | { type: 'error'; status: number; body: string; cookies: Record<string, string> }

/**
 * 2FA 流程的状态推进 POST（juno JS 逆向结论）：
 *  - s3 挑战页（发送验证码，juno-sendCode）: _eventId=submit + codeType=<radio 前缀，如 email>
 *  - s4 验证码页（提交 OTP，juno-codeVerify）: twoFactorCode=<6/8 位> + _eventId=submit
 *    （旧版 MFA 页 juno-mfa 字段为 oneTimeCode，作为回退）
 * 执行后 302 的下一个 execution 即流程下一状态；200 表示页面重渲染（错误页）
 */
async function postJunoEvent(
  execution: string,
  cookies: Record<string, string>,
  data: Record<string, string>,
): Promise<JunoEventResult> {
  let resp: { status: number; headers: Record<string, any>; data?: any } | undefined
  try {
    resp = await axios.post('https://signin.ea.com/p/juno/login', data, {
      params: { execution, ...JUNO_PARAMS },
      headers: { Cookie: cookieHeader(cookies), 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
    })
  } catch (error) {
    resp = (error as AxiosError).response
  }
  if (!resp) return { type: 'error', status: 0, body: '网络错误', cookies }
  const merged = mergeCookiesInto(cookies, resp.headers['set-cookie'])
  if (resp.status === 302) {
    const location = resp.headers['location'] as string
    const url = new URL(location, 'https://signin.ea.com')
    const nextExecution = url.searchParams.get('execution')
    if (!nextExecution) return { type: 'error', status: 302, body: '302 未携带新 execution: ' + location, cookies: merged }
    return { type: 'ok', execution: nextExecution, location, cookies: merged }
  }
  return { type: 'error', status: resp.status, body: String(resp.data ?? '').slice(0, 500), cookies: merged }
}

/**
 * 跟随 2FA 完成后的 302 链（→ accounts.ea.com/connect/auth → racenet.com/oauthCallback?code=...），
 * 取回 code；响应 set-cookie 中含设备信任凭证（remid/sid），供后续静默认证
 */
async function followAuthChainToCode(href: string, cookies: Record<string, string>) {
  let url = href
  let jar = { ...cookies }
  let lastSetCookies: string[] | undefined
  for (let hop = 0; hop < 8; hop++) {
    const u = new URL(url)
    const code = u.searchParams.get('code')
    if (code) return { code, eaDeviceCookies: parseEaDeviceCookies(lastSetCookies) }
    if (u.hostname !== 'signin.ea.com' && u.hostname !== 'accounts.ea.com') throw new Error('重定向链离开 EA 域但未取得 code: ' + url)
    let resp: { status: number; headers: Record<string, any> } | undefined
    try {
      resp = await axios.get(url, { maxRedirects: 0, headers: { Cookie: cookieHeader(jar) } })
    } catch (error) {
      resp = (error as AxiosError).response
    }
    if (!resp || resp.status !== 302) throw new Error(`重定向链中断（${resp?.status ?? '无响应'}）: ${url}`)
    lastSetCookies = resp.headers['set-cookie']
    jar = mergeCookiesInto(jar, lastSetCookies)
    url = new URL(resp.headers['location'], url).href
  }
  throw new Error('重定向链跳数超限')
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
  let openLoginWindowPromise: Promise<{ refreshToken: string; eaDeviceCookies?: EaDeviceCookies }> | null = null
  ipcMain.handle(ChannelKey.OPEN_LOGIN_WINDOW, (_event, autoClose = true) => {
    if (openLoginWindowPromise) return openLoginWindowPromise
    let loginWindow: BrowserWindow
    openLoginWindowPromise = new Promise(async (resolve, reject) => {
      await removeRefreshTokenCookie().catch(reject)
      loginWindow = new BrowserWindow({ parent: win, modal: true, show: true })
      openDeveloperMode(loginWindow)
      onRefreshTokenChanged((refreshToken) => {
        // 登录成功时顺带收集 EA 设备信任凭证，供邮箱登录静默认证使用
        const deviceCookies: EaDeviceCookies = {}
        session.defaultSession.cookies
          .get({})
          .then((cookies) => {
            for (const { name, value } of cookies) {
              if (name === 'remid' || name === 'sid' || name === '_nx_mpcid') deviceCookies[name] = value
            }
          })
          .catch(() => {})
          .finally(() => resolve({ refreshToken, eaDeviceCookies: Object.keys(deviceCookies).length ? deviceCookies : undefined }))
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

  /**
   * 邮箱登录 2FA 中间态：从 LOGIN_BY_EMAIL 触发 2FA 起，到 SEND_CODE / SUBMIT_CODE 完成登录止，
   * 跨多次 IPC 调用共享（参照 OPEN_LOGIN_WINDOW 的闭包状态模式）
   */
  type PendingEmailLogin = {
    fid: string
    execution: string
    cookies: Record<string, string>
  }
  let pendingEmailLogin: PendingEmailLogin | null = null

  ipcMain.handle(
    ChannelKey.LOGIN_BY_EMAIL,
    async (_event, { email, password, eaDeviceCookies }: { email: string; password: string; eaDeviceCookies?: EaDeviceCookies }) => {
      pendingEmailLogin = null
      // 静默认证：带设备信任凭证时 EA 直接下发 code，免密码免 2FA
      const fidResult = await getFid(eaDeviceCookies)
      if (fidResult.type === 'silent') {
        const accessTokenData = await getAccessToken(fidResult.silentCode)
        return {
          status: 'success',
          ...accessTokenData,
          eaDeviceCookies: { ...eaDeviceCookies, ...fidResult.eaDeviceCookies },
        } as const
      }
      const executionData = await getExecution(fidResult.fid)
      const result = await submitCredentials(email, password, executionData)
      if (result.type === '2fa') {
        pendingEmailLogin = { fid: fidResult.fid, execution: result.execution, cookies: result.cookies }
        return { status: '2fa_required' } as const
      }
      const { code, eaDeviceCookies: newDeviceCookies } = await getCode(fidResult.fid, result.nxMpcid)
      const accessTokenData = await getAccessToken(code)
      return {
        status: 'success',
        ...accessTokenData,
        eaDeviceCookies: { ...eaDeviceCookies, ...newDeviceCookies },
      } as const
    },
  )

  /**
   * 发送 2FA 验证码（juno-sendCode 逆向：_eventId=submit + codeType=email；
   * 失败时回退不携带 codeType，交由服务端默认投递渠道）
   */
  ipcMain.handle(ChannelKey.LOGIN_BY_EMAIL_SEND_CODE, async () => {
    const pending = pendingEmailLogin
    if (!pending) throw new Error('登录会话已过期，请重新发起邮箱登录')
    const attempts: Record<string, string>[] = [{ _eventId: 'submit', codeType: 'email' }, { _eventId: 'submit' }]
    for (const data of attempts) {
      const r = await postJunoEvent(pending.execution, pending.cookies, data)
      pending.cookies = r.cookies
      if (r.type === 'ok') {
        pending.execution = r.execution
        return
      }
    }
    throw new Error('验证码发送失败（EA 风控拦截），请改用「官方网站登录」完成一次登录（后续登录将免验证）')
  })

  /**
   * 提交 2FA 验证码完成登录（juno-codeVerify 逆向：twoFactorCode=6/8 位 + _eventId=submit；
   * 旧版 MFA 页字段 oneTimeCode 作为回退），成功后跟随重定向链换取 token
   */
  ipcMain.handle(ChannelKey.LOGIN_BY_EMAIL_SUBMIT_CODE, async (_event, code: string) => {
    const pending = pendingEmailLogin
    if (!pending) throw new Error('登录会话已过期，请重新发起邮箱登录')
    if (!/^\d{5,8}$/.test(code)) throw new Error('验证码格式不正确（应为 5-8 位数字）')
    let lastError = '验证码提交失败，请重试'
    const attempts: Record<string, string>[] = [{ _eventId: 'submit', twoFactorCode: code }, { _eventId: 'submit', oneTimeCode: code }]
    for (const data of attempts) {
      const r = await postJunoEvent(pending.execution, pending.cookies, data)
      pending.cookies = r.cookies
      if (r.type !== 'ok') {
        lastError = '验证码提交失败，请重试'
        continue
      }
      try {
        const { code: authCode, eaDeviceCookies } = await followAuthChainToCode(r.location, pending.cookies)
        const accessTokenData = await getAccessToken(authCode)
        pendingEmailLogin = null
        return { ...accessTokenData, eaDeviceCookies } as const
      } catch (e) {
        lastError = (e as Error).message
      }
    }
    throw new Error(lastError)
  })
}
export default handler
