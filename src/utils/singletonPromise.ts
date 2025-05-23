function singletonPromise<R = any>(getter: () => Promise<R>) {
  let promise: Promise<R> | null = null

  return () => {
    if (!promise) {
      promise = getter()
      promise.finally(() => {
        promise = null
      })
    }
    return promise
  }
}

export default singletonPromise
