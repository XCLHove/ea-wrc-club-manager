interface Data {
  setTime: number;
  expirationTime: number;
  value: any;
}

const prefix = "cache_";

export const localStorageCache = {
  set: (key: string, value: any, expirationTime: number) => {
    const time = new Date().getTime();
    const data: Data = {
      setTime: time,
      expirationTime: expirationTime,
      value: value,
    };

    localStorage.setItem(`${prefix}${key}`, JSON.stringify(data));
  },
  get: (key: string) => {
    const dataStr = localStorage.getItem(`${prefix}${key}`);
    if (!dataStr) return null;

    const data: Data = JSON.parse(dataStr);
    if (new Date().getTime() - data.setTime > data.expirationTime) {
      localStorage.removeItem(key);
      return null;
    }

    return data.value;
  },
  remove: (key: string) => {
    localStorage.removeItem(`${prefix}${key}`);
  },
};
