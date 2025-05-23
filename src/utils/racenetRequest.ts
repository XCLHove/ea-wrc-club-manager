import axios, { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/useUserStore.ts'

const racenetRequest = axios.create({
  baseURL: 'https://web-api.racenet.com/api',
  timeout: 30 * 1000,
})

racenetRequest.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()

    config.headers['Content-Type'] ||= 'application/json;charset=utf-8'
    config.headers['Authorization'] ||= `Bearer ${userStore.accessToken}`
    return config
  },
  (error: Error) => {
    ElMessage.error(`请求出错：${error.message}`)
    return Promise.reject(error)
  },
)

racenetRequest.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const userStore = useUserStore()
    const response = error.response
    const config = error.config

    // 访问令牌过期
    if (response?.status === 401) {
      // 刷新访问令牌
      await userStore.refreshAccessToken()
      // 移除过期的访问令牌
      delete config!.headers['Authorization']
      // 重新请求
      return await racenetRequest(config as any)
    }

    return Promise.reject(error)
  },
)

export default racenetRequest
