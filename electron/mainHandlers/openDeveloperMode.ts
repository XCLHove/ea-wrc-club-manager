import { optimizer } from "@electron-toolkit/utils";
import { BrowserWindow } from "electron";

const openDeveloperMode = (win: BrowserWindow) => {
  // F12 打开/关闭开发者模式
  optimizer.watchWindowShortcuts(win);
};

export default openDeveloperMode;
