import racenetRequest from '../utils/racenetRequest.ts'
import { User } from '@/interfaces/User.ts'
import singletonPromise from '@/utils/singletonPromise.ts'
import type { EaDeviceCookies } from '../../electron/pre-loaders/auth.ts'

export type { EaDeviceCookies }

/**
 * 刷新访问令牌
 */
export const refreshAccessTokenApi = (refreshToken: string) => {
  if (!refreshToken) return Promise.reject(new Error('need login'))
  return window.tokenApi.refreshAccessToken(refreshToken)
}

export const loginByOfficialWebsiteApi = singletonPromise(() => {
  return window.tokenApi.openLoginWindow().then(({ refreshToken, eaDeviceCookies }) => {
    return refreshAccessTokenApi(refreshToken).then((r) => ({ ...r, eaDeviceCookies }))
  })
})

export const loginApi = singletonPromise(() => {
  return loginByOfficialWebsiteApi()
})

export const loginByEmailApi = (email: string, password: string, eaDeviceCookies?: EaDeviceCookies) => {
  return window.tokenApi.loginByEmail(email, password, eaDeviceCookies)
}

/**
 * 发送 2FA 验证码（loginByEmailApi 返回 2fa_required 后调用）
 */
export const loginByEmailSendCodeApi = () => {
  return window.tokenApi.loginByEmailSendCode()
}

/**
 * 提交 2FA 验证码，完成登录
 */
export const loginByEmailSubmitCodeApi = (code: string) => {
  return window.tokenApi.loginByEmailSubmitCode(code)
}

/**
 * 获取用户信息
 */
export const profileApi = () => {
  return racenetRequest.get('/identity/secured').then((r) => r.data as User)
}
