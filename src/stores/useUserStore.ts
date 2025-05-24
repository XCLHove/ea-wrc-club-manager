import { defineStore } from 'pinia'
import { computed, customRef, h, onMounted, ref, watch, withDirectives } from 'vue'
import { loginByEmailApi, loginByOfficialWebsiteApi, profileApi, refreshAccessTokenApi } from '@/api/authApi.ts'
import { User } from '@/interfaces/User.ts'
import { accessTokenUtil } from '@/utils/accessTokenUtil.ts'
import localStorageRef from '@/composables/localStorageRef.ts'
import singletonPromise from '@/utils/singletonPromise.ts'
import { Action, ElCheckbox, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, FormInstance, FormRules, vLoading } from 'element-plus'
import { refreshTokenUtil } from '@/utils/refreshTokenUtil.ts'
import { Lock, User as UserIcon } from '@element-plus/icons-vue'
import gePromise from '@/utils/gePromise.ts'
import '@/assets/css/email-login-dialog.css'

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
    return ElMessageBox({
      title: '选择登录方式',
      showCancelButton: true,
      confirmButtonText: '官方网站登录',
      cancelButtonText: '邮箱登录',
      distinguishCancelAndClose: true,
    })
      .then(() => {
        return () => loginByOfficialWebsiteApi()
      })
      .catch((action: Action) => {
        if (action === 'close') return () => Promise.reject(new Error('取消登录'))
        return () => openEmailLoginDialog()
      })
      .then((doLogin) => {
        return doLogin()
          .then((r) => {
            accessToken.value = r.accessToken
            refreshToken.value = r.refreshToken
            ElMessage.success('登录成功')
          })
          .catch((e) => {
            ElMessage.info('取消登录')
            accessToken.value = ''
            refreshToken.value = ''
            user.value = void 0 as any
            return Promise.reject(e)
          })
      })
  })

  function openEmailLoginDialog() {
    const needRememberEmail = localStorageRef(false, 'needRememberEmail')
    const needRememberPassword = localStorageRef(false, 'needRememberPassword')
    const rememberEmail = localStorageRef('', 'rememberEmail')
    const rememberPassword = localStorageRef('', 'rememberPassword')

    const form = ref({
      email: rememberEmail.value,
      password: rememberPassword.value,
    })
    const formRules: FormRules<typeof form.value> = {
      email: [
        { required: true, type: 'email', message: '请输入邮箱' },
        { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱' },
      ],
      password: [{ required: true, message: '请输入密码' }],
    }
    const formRef = ref<FormInstance>()
    const loading = ref(false)

    watch([() => needRememberEmail.value, () => form.value.email], () => {
      let email = ''
      if (needRememberEmail.value) {
        email = form.value.email
      }
      rememberEmail.value = email
    })
    watch([() => needRememberPassword.value, () => form.value.password], () => {
      let password = ''
      if (needRememberPassword.value) {
        password = form.value.password
      }
      rememberPassword.value = password
    })

    const { promise: loginPromise, resolve, reject } = gePromise<Awaited<ReturnType<typeof loginByEmailApi>>>()
    ElMessageBox({
      title: '邮箱登录',
      showCancelButton: true,
      confirmButtonText: '登录',
      customClass: 'email-login-dialog',
      confirmButtonClass: 'email-login-dialog-confirm',
      cancelButtonClass: 'email-login-dialog-cancel',
      closeOnPressEscape: false,
      closeOnClickModal: false,
      async beforeClose(action, _instance, done) {
        if (action !== 'confirm') return done()
        const valid = await formRef.value!.validate()
        if (!valid) return
        if (loading.value) return
        loading.value = true
        loginByEmailApi(form.value.email, form.value.password)
          .then((r) => {
            resolve(r)
            done()
          })
          .catch((e) => {
            ElMessage.error(e.message)
          })
          .finally(() => {
            loading.value = false
          })
      },
      message: () => {
        return withDirectives(
          h(
            ElForm,
            {
              rules: formRules,
              model: form.value,
              ref: (v) => (formRef.value = v as any),
            },
            () => [
              h(
                ElFormItem,
                {
                  label: '邮箱',
                  prop: 'email',
                },
                {
                  default: () =>
                    h(ElInput, {
                      clearable: true,
                      placeholder: '请输入邮箱',
                      modelValue: form.value.email,
                      'onUpdate:modelValue': (v) => (form.value.email = v),
                      prefixIcon: UserIcon,
                    }),
                },
              ),
              h(
                ElFormItem,
                { label: '密码', prop: 'password' },
                {
                  default: () =>
                    h(ElInput, {
                      clearable: true,
                      placeholder: '请输入密码',
                      modelValue: form.value.password,
                      'onUpdate:modelValue': (v) => (form.value.password = v),
                      showPassword: true,
                      type: 'password',
                      prefixIcon: Lock,
                    }),
                },
              ),
              h(
                ElFormItem,
                {
                  style: {
                    marginBottom: '0',
                  },
                },
                {
                  default: () => [
                    h(
                      ElCheckbox,
                      {
                        label: '记住邮箱',
                        trueValue: 1,
                        falseValue: 0,
                        modelValue: needRememberEmail.value ? 1 : 0,
                        'onUpdate:modelValue': (v) => (needRememberEmail.value = v === 1),
                      },
                      {},
                    ),
                    h(
                      ElCheckbox,
                      {
                        label: '记住密码',
                        trueValue: 1,
                        falseValue: 0,
                        modelValue: needRememberPassword.value ? 1 : 0,
                        'onUpdate:modelValue': (v) => (needRememberPassword.value = v === 1),
                      },
                      {},
                    ),
                  ],
                },
              ),
            ],
          ),
          [[vLoading, loading.value]],
        )
      },
    }).catch(() => {
      reject(new Error('取消登录'))
    })
    return loginPromise
  }

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
