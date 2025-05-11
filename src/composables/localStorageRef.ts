import { debounce } from '@/utils/debounce/debounce.ts'
import { customRef } from 'vue'

type Options = Partial<{
  /**
   * 防抖，避免频繁写入 localStorage，默认0，表示不防抖（单位：ms）
   */
  saveDebounceTime: number
  /**
   * 存入 localStorage 的数据的有效时间，默认为0，表示永久（单位：ms）
   */
  duration: number
}>

type LocalStorageRefValue<T> = {
  expireTime: number
  value: T
}

const nowTime = () => new Date().getTime()

const localStorageRef = <T>(defaultValue: T, key: string, options?: Options) => {
  let value = defaultValue

  const saveValue = (newValue: T) => {
    let expireTime = 0
    if (options?.duration && options.duration > 0) {
      expireTime = new Date().getTime() + options.duration
    }
    localStorage.setItem(
      key,
      JSON.stringify({
        expireTime: expireTime,
        value: newValue,
      } as LocalStorageRefValue<T>),
    )
  }

  const oldValueStr = localStorage.getItem(key)
  if (oldValueStr) {
    const oldValue = JSON.parse(oldValueStr) as LocalStorageRefValue<T>
    if (oldValue.expireTime === 0 || nowTime() < oldValue.expireTime) {
      value = oldValue.value
    }
  } else {
    saveValue(defaultValue)
  }

  const debounceTime = options?.saveDebounceTime || 0
  const saveValueDebounce = debounce(saveValue, debounceTime)

  return customRef<T>((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue: T) {
        trigger()
        value = newValue
        saveValueDebounce(newValue)
      },
    }
  })
}

export default localStorageRef
