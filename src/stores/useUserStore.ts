import { defineStore } from 'pinia'
import { computed, customRef, h, onMounted, ref, watch, withDirectives } from 'vue'
import { loginByEmailApi, loginByEmailSendCodeApi, loginByEmailSubmitCodeApi, loginByOfficialWebsiteApi, profileApi, refreshAccessTokenApi, type EaDeviceCookies } from '@/api/authApi.ts'
import { User } from '@/interfaces/User.ts'
import { accessTokenUtil } from '@/utils/accessTokenUtil.ts'
import localStorageRef from '@/composables/localStorageRef.ts'
import singletonPromise from '@/utils/singletonPromise.ts'
import { Action, ElButton, ElCheckbox, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, FormInstance, FormRules, vLoading } from 'element-plus'
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
  // EA 设备信任凭证（remid/sid/_nx_mpcid）：登录成功后持久化，邮箱登录时先尝试静默认证免密码免 2FA。
  // 键为邮箱；官网登录窗口收集到的存于 '_'（任意邮箱的兜底凭证）
  const eaDeviceCookiesMap = localStorageRef<Record<string, EaDeviceCookies>>({}, 'eaDeviceCookiesMap')

  function saveEaDeviceCookies(email: string, cookies?: EaDeviceCookies) {
    if (!cookies || !Object.keys(cookies).length) return
    eaDeviceCookiesMap.value = { ...eaDeviceCookiesMap.value, [email]: cookies }
  }

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
            saveEaDeviceCookies('_', r.eaDeviceCookies)
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
      code: '',
    })
    const formRules: FormRules<typeof form.value> = {
      email: [
        { required: true, type: 'email', message: '请输入邮箱' },
        { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱' },
      ],
      password: [{ required: true, message: '请输入密码' }],
      code: [{ required: true, message: '请输入验证码' }],
    }
    const formRef = ref<FormInstance>()
    const loading = ref(false)
    // 是否处于 2FA 双重验证模式（EA 风控触发，需先发送验证码再登录）
    const is2fa = ref(false)
    const codeSendLoading = ref(false)
    const countdown = ref(0)
    let countdownTimer: ReturnType<typeof setInterval> | null = null

    function startCountdown(seconds = 60) {
      countdown.value = seconds
      countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) stopCountdown()
      }, 1000)
    }
    function stopCountdown() {
      if (countdownTimer) clearInterval(countdownTimer)
      countdownTimer = null
      countdown.value = 0
    }
    function sendCode() {
      if (codeSendLoading.value || countdown.value > 0) return
      codeSendLoading.value = true
      loginByEmailSendCodeApi()
        .then(() => {
          ElMessage.success('验证码已发送，请查收邮箱或短信')
          startCountdown(60)
        })
        .catch((e) => {
          ElMessage.error(e.message)
        })
        .finally(() => {
          codeSendLoading.value = false
        })
    }

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

    const { promise: loginPromise, resolve, reject } = gePromise<{ accessToken: string; refreshToken: string; eaDeviceCookies?: EaDeviceCookies }>()
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
        if (action !== 'confirm') {
          stopCountdown()
          return done()
        }
        const valid = await formRef.value!.validate()
        if (!valid) return
        if (loading.value) return
        loading.value = true
        if (!is2fa.value) {
          // 静默认证种子：优先用该邮箱的凭证，其次用官网登录窗口收集的通用凭证
          loginByEmailApi(form.value.email, form.value.password, eaDeviceCookiesMap.value[form.value.email] || eaDeviceCookiesMap.value['_'])
            .then((r) => {
              if (r.status === '2fa_required') {
                // EA 风控要求双重验证：弹窗切换为验证码模式，等待用户发送并输入验证码
                is2fa.value = true
                return
              }
              if (r.eaDeviceCookies) {
                eaDeviceCookiesMap.value = { ...eaDeviceCookiesMap.value, [form.value.email]: r.eaDeviceCookies }
              }
              stopCountdown()
              resolve(r)
              done()
            })
            .catch((e) => {
              ElMessage.error(e.message)
            })
            .finally(() => {
              loading.value = false
            })
        } else {
          loginByEmailSubmitCodeApi(form.value.code)
            .then((r) => {
              if (r.eaDeviceCookies) {
                eaDeviceCookiesMap.value = { ...eaDeviceCookiesMap.value, [form.value.email]: r.eaDeviceCookies }
              }
              stopCountdown()
              resolve(r)
              done()
            })
            .catch((e) => {
              ElMessage.error(e.message)
            })
            .finally(() => {
              loading.value = false
            })
        }
      },
      message: () => {
        if (is2fa.value) {
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
                  'div',
                  {
                    style: {
                      marginBottom: '12px',
                      color: 'var(--el-text-color-secondary)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    },
                  },
                  '检测到该账号需要双重验证，请点击“发送验证码”，收到验证码后输入并登录',
                ),
                h(
                  ElFormItem,
                  { label: '验证码', prop: 'code' },
                  {
                    default: () =>
                      h('div', { style: { display: 'flex', gap: '8px', width: '100%' } }, [
                        h(ElInput, {
                          clearable: true,
                          placeholder: '请输入验证码',
                          modelValue: form.value.code,
                          'onUpdate:modelValue': (v) => (form.value.code = v),
                          prefixIcon: Lock,
                        }),
                        h(
                          ElButton,
                          {
                            style: { flexShrink: 0 },
                            disabled: countdown.value > 0,
                            loading: codeSendLoading.value,
                            onClick: sendCode,
                          },
                          () => (countdown.value > 0 ? `${countdown.value}s 后重发` : '发送验证码'),
                        ),
                      ]),
                  },
                ),
              ],
            ),
            [[vLoading, loading.value]],
          )
        }
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
      stopCountdown()
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
