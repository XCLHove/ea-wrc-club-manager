function gePromise<T = unknown>() {
  let returnResolve: (value: T) => void = () => {}
  let returnReject: (reason: any) => void = () => {}
  const promise = new Promise<T>((resolve, reject) => {
    returnResolve = resolve
    returnReject = reject
  })

  return {
    promise,
    resolve: returnResolve,
    reject: returnReject,
  }
}

export default gePromise
