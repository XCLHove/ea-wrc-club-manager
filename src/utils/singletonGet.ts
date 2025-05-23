const singletonGet = <R>(getter: () => R) => {
  let cache: R | null = null

  return () => {
    if (!cache) {
      cache = getter()
    }
    return cache
  }
}

export default singletonGet
