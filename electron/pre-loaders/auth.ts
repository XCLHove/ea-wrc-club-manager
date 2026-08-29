import { contextBridge, ipcRenderer } from 'electron'
import ChannelKey from '../ChannelKey.ts'

/**
 * EA 设备信任凭证：登录成功后持久化，下次登录时传入可实现静默认证（免密码免 2FA）
 */
export type EaDeviceCookies = { remid?: string; sid?: string; _nx_mpcid?: string }

/**
 * 邮箱登录结果：success 直接返回令牌；2fa_required 表示 EA 风控要求双重验证，
 * 需调用 loginByEmailSendCode 发送验证码、loginByEmailSubmitCode 提交验证码
 */
export type LoginByEmailResult = { status: 'success'; accessToken: string; refreshToken: string; eaDeviceCookies?: EaDeviceCookies } | { status: '2fa_required' }

const tokenApi = {
  /**
   * @returns refreshToken 及 EA 设备信任凭证（供邮箱登录静默认证）
   */
  openLoginWindow: (autoClose = true) => {
    return ipcRenderer.invoke(ChannelKey.OPEN_LOGIN_WINDOW, autoClose) as Promise<{ refreshToken: string; eaDeviceCookies?: EaDeviceCookies }>
  },
  refreshAccessToken: (refreshToken: string) => {
    return ipcRenderer.invoke(ChannelKey.REFRESH_ACCESS_TOKEN, refreshToken) as Promise<{ accessToken: string; refreshToken: string }>
  },
  loginByEmail: (email: string, password: string, eaDeviceCookies?: EaDeviceCookies) => {
    return ipcRenderer.invoke(ChannelKey.LOGIN_BY_EMAIL, { email, password, eaDeviceCookies }) as Promise<LoginByEmailResult>
  },
  /**
   * 发送 2FA 验证码（需先调用 loginByEmail 返回 2fa_required）
   */
  loginByEmailSendCode: () => {
    return ipcRenderer.invoke(ChannelKey.LOGIN_BY_EMAIL_SEND_CODE) as Promise<void>
  },
  /**
   * 提交 2FA 验证码，完成登录
   */
  loginByEmailSubmitCode: (code: string) => {
    return ipcRenderer.invoke(ChannelKey.LOGIN_BY_EMAIL_SUBMIT_CODE, code) as Promise<{ accessToken: string; refreshToken: string; eaDeviceCookies?: EaDeviceCookies }>
  },
}

declare global {
  interface Window {
    tokenApi: typeof tokenApi
  }
}

const loader = () => {
  contextBridge.exposeInMainWorld('tokenApi', tokenApi)
}
export default loader
