/**
 * 函数防抖
 * @param fun 函数
 * @param delaySecond 延迟执行的秒数
 * @returns 防抖函数
 */
export function debounce<A extends any[], R>(
  fun: (...args: A) => R,
  delaySecond = 1,
): (...args: A) => void {
  const timeoutIds = new Map<typeof fun, NodeJS.Timeout>();
  return (...args: A) => {
    let timeoutId = timeoutIds.get(fun);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fun(...args);
      clearTimeout(timeoutId);
    }, delaySecond * 1000);
    timeoutIds.set(fun, timeoutId);
  };
}
