import racenetRequest from '../utils/racenetRequest.ts'
import { User } from '@/interfaces/User.ts'
import singletonPromise from '@/utils/singletonPromise.ts'

/**
 * 刷新访问令牌
 */
export const refreshAccessTokenApi = (refreshToken: string) => {
  if (!refreshToken) return Promise.reject(new Error('need login'))
  return window.tokenApi.refreshAccessToken(refreshToken)
}

export const loginByOfficialWebsiteApi = singletonPromise(() => {
  return window.tokenApi.openLoginWindow().then(refreshAccessTokenApi)
})

export const loginApi = singletonPromise(() => {
  return loginByOfficialWebsiteApi()
})

export const loginByEmailApi = (email: string, password: string) => {
  return window.tokenApi.loginByEmail(email, password)
}

/**
 * 获取用户信息
 */
export const profileApi = () => {
  return racenetRequest.get('/identity/secured').then((r) => r.data as User)
}
