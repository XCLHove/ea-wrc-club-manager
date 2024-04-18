import { customRef } from "vue";

/**
 * 防抖ref
 * @param value 值
 * @param delaySecond 延迟秒数，默认1s
 */
export function debounceRef(value: any, delaySecond = 1) {
    let timerId: NodeJS.Timeout;
    return customRef((track, trigger) => {
        return {
            get() {
                track();
                return value;
            },
            set(val: any) {
                clearTimeout(timerId);
                timerId = setTimeout(() => {
                    trigger();
                    value = val;
                }, delaySecond * 1000);
            },
        };
    });
}
