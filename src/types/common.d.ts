export {}

declare global {
  type Prettify<T> = {} & {
    [K in keyof T]: T[K]
  }

  type ExcludeType<T, E> = T extends E ? never : T

  type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

  type RequireKey<T, RK extends keyof T> = Pick<T, keyof Omit<T, RK>> & {
    [K in RK]-?: T[K]
  }

  type MaybePromise<T> = T | Promise<T>

  type MaybeNull<T> = T | null

  type None = null | undefined | void
}
