import { contextBridge, ipcRenderer } from "electron";
import ChannelKey from "../ChannelKey.ts";

const tokenApi = () => {
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
}

export default tokenApi