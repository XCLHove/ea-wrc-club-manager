import { ipcRenderer, contextBridge } from "electron";
import ChannelKey from "./ChannelKey.ts";

// --------- Expose some API to the Renderer process ---------
// contextBridge.exposeInMainWorld("ipcRenderer", {
//   on(...args: Parameters<typeof ipcRenderer.on>) {
//     const [channel, listener] = args;
//     return ipcRenderer.on(channel, (event, ...args) =>
//       listener(event, ...args),
//     );
//   },
//   off(...args: Parameters<typeof ipcRenderer.off>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.off(channel, ...omit);
//   },
//   send(...args: Parameters<typeof ipcRenderer.send>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.send(channel, ...omit);
//   },
//   invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.invoke(channel, ...omit);
//   },
// });

contextBridge.exposeInMainWorld("tokenApi", {
  addListener: (callback: (cookie: Electron.Cookie) => void) => {
    const listener: Parameters<typeof ipcRenderer.on>[1] = (
      _,
      cookie: Electron.Cookie,
    ) => {
      callback(cookie);
    };
    ipcRenderer.on(ChannelKey.ON_CHANGE_REFRESH_TOKEN, listener);

    return () => {
      ipcRenderer.off(ChannelKey.ON_CHANGE_REFRESH_TOKEN, listener);
    };
  },
  openLoginWindow: (closeCallback = () => {}) => {
    ipcRenderer.send(ChannelKey.OPEN_LOGIN_WINDOW);

    const onCloseListener = () => {
      ipcRenderer.off(ChannelKey.CLOSE_LOGIN_WINDOW, onCloseListener);
      closeCallback();
    };
    ipcRenderer.on(ChannelKey.CLOSE_LOGIN_WINDOW, onCloseListener);
    return () => {
      ipcRenderer.send(ChannelKey.CLOSE_LOGIN_WINDOW);
    };
  },
  remove: () => {
    ipcRenderer.send(ChannelKey.REMOVE_REFRESH_TOKEN);
  },
  refresh: (refreshToken: string) => {
    return ipcRenderer.invoke(ChannelKey.REFRESH_TOKEN, refreshToken);
  },
});
