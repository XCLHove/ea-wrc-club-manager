import { BrowserWindow, ipcMain } from "electron";
import ChannelKey from "../ChannelKey";

let loginWin: BrowserWindow | null;
const loginWindow = (win: BrowserWindow) => {
  ipcMain.on(ChannelKey.OPEN_LOGIN_WINDOW, () => {
    if (!win) return;
    if (loginWin) {
      loginWin.focus();
      return;
    }
    loginWin = new BrowserWindow({ parent: win, modal: true, show: true });
    loginWin.loadURL("https://racenet.com");

    const onCloseListener = () => {
      win?.webContents.send(ChannelKey.CLOSE_LOGIN_WINDOW);
      loginWin?.off("closed", onCloseListener);
      loginWin = null;
    };
    loginWin.on("close", onCloseListener);
  });

  ipcMain.on(ChannelKey.CLOSE_LOGIN_WINDOW, () => {
    if (!loginWin) return;
    loginWin.close();
  });
};
export default loginWindow;
