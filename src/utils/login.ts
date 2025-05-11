import { refreshToken, removeRefreshToken } from '@/api/authApi.ts'
import { refreshTokenUtil } from '@/utils/refreshTokenUtil.ts'
import { elPrompt } from '@/utils/elPrompt.ts'
import { ElMessage } from 'element-plus'

/**
 * 登录
 * @param autoClose 是否自动关闭登录窗口
 */
export const login = (() => {
  let running = false

  return async (autoClose = true) => {
    if (running) return
    running = true

    await removeRefreshToken()

    let closeLoginWindow: ReturnType<typeof window.tokenApi.openLoginWindow>
    let removeListener: ReturnType<typeof window.tokenApi.addListener>
    new Promise<void>((resolve, reject) => {
      closeLoginWindow = window.tokenApi.openLoginWindow(() => {
        running = false
        reject()
      })

      removeListener = window.tokenApi.addListener(({ value }) => {
        refreshTokenUtil.set(value)
        refreshToken().finally(() => {
          running = false
        })
        resolve()
      })
    })
      .then(() => {
        ElMessage.success('登录成功！')
      })
      .catch(() => {
        ElMessage.info('取消登录！')
      })
      .finally(() => {
        removeListener()
        if (autoClose) closeLoginWindow()
      })
  }
})()
