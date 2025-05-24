function throttle<Args extends any[]>(func: (...args: Args) => any, wait = 0) {
  let running = false
  return function (...args: Args) {
    if (running) return
    running = true
    try {
      func(...args)
    } catch (error) {
      throw error
    } finally {
      setTimeout(() => {
        running = false
      }, wait)
    }
  }
}

export default throttle
