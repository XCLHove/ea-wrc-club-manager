import { defineStore } from 'pinia'
import { computed, customRef, onMounted, ref, watch } from 'vue'
import { loginByOfficialWebsiteApi, profileApi, refreshAccessTokenApi } from '@/api/authApi.ts'
import { User } from '@/interfaces/User.ts'
import { accessTokenUtil } from '@/utils/accessTokenUtil.ts'
import localStorageRef from '@/composables/localStorageRef.ts'
import singletonPromise from '@/utils/singletonPromise.ts'
import { ElMessage } from 'element-plus'
import { refreshTokenUtil } from '@/utils/refreshTokenUtil.ts'

export const useUserStore = defineStore('useUserStore', () => {
  const user = localStorageRef<User>(void 0 as any, 'user')
  const accessToken = customRef((track, trigger) => {
    let value = accessTokenUtil.get() || ''
    return {
      get: () => {
        track()
        return value
      },
      set: (newValue: string) => {
        trigger()
        value = newValue
        accessTokenUtil.set(newValue)
      },
    }
  })
  const refreshToken = customRef((track, trigger) => {
    let value = refreshTokenUtil.get() || ''
    return {
      get: () => {
        track()
        return value
      },
      set: (newValue: string) => {
        trigger()
        value = newValue
        refreshTokenUtil.set(newValue)
      },
    }
  })
  const isLogin = computed(() => user.value !== void 0)

  watch(
    () => accessToken.value,
    (newValue) => {
      if (!newValue) return
      refreshUser()
    },
  )
  onMounted(() => {
    refreshUser()
  })

  const refreshUser = singletonPromise(() => {
    return profileApi().then((r) => {
      user.value = r
    })
  })

  const login = singletonPromise(() => {
    let doLogin = () => {
      return loginByOfficialWebsiteApi()
    }
    return doLogin()
      .then((r) => {
        accessToken.value = r.accessToken
        refreshToken.value = r.refreshToken
        ElMessage.success('登录成功')
        return r
      })
      .catch((e) => {
        ElMessage.info('取消登录')
        accessToken.value = ''
        refreshToken.value = ''
        user.value = void 0 as any
        return Promise.reject(e)
      })
  })

  function logout() {
    user.value = void 0 as any
    accessToken.value = ''
    refreshToken.value = ''
    ElMessage.success('退出成功')
  }

  function refreshAccessToken() {
    return refreshAccessTokenApi(refreshToken.value)
      .then((r) => {
        accessToken.value = r.accessToken
        refreshToken.value = r.refreshToken
      })
      .catch(login)
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLogin,
    login,
    logout,
    refreshAccessToken,
  }
})
