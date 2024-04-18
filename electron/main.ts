import { app, BrowserWindow, Menu, session, ipcMain } from "electron";
import path from "node:path";
import { optimizer } from "@electron-toolkit/utils";
import axios from "axios";
import ChannelKey from "./ChannelKey.ts";

process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null;
let loginWin: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }

  // F12 打开/关闭开发者模式
  optimizer.watchWindowShortcuts(win);

  // 关闭默认菜单
  Menu.setApplicationMenu(null);
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();

  // tokenApi
  (() => {
    const refreshTokenCookieName = "RACENET-REFRESH-TOKEN";
    const apiUrl = "https://web-api.racenet.com";

    session.defaultSession.cookies.addListener("changed", (_, cookie) => {
      if (cookie.name !== refreshTokenCookieName) return;
      win?.webContents.send(ChannelKey.ON_CHANGE_REFRESH_TOKEN, cookie);
    });

    ipcMain.on(ChannelKey.REMOVE_REFRESH_TOKEN, async () => {
      await session.defaultSession.cookies.remove(
        apiUrl,
        refreshTokenCookieName,
      );
    });

    ipcMain.handle(
      ChannelKey.REFRESH_TOKEN,
      async (_, refreshToken: string) => {
        return await axios
          .post(
            `${apiUrl}/api/identity/refresh-auth`,
            {
              redirectUri: "https://racenet.com/oauthCallback",
              clientId: "RACENET_1_JS_WEB_APP",
              grantType: "refresh_token",
            },
            {
              headers: {
                Cookie: `${refreshTokenCookieName}=${refreshToken}`,
                Origin: "https://racenet.com",
                Referer: "https://racenet.com/",
              },
            },
          )
          .then(({ data, status }) => {
            if (status !== 200) return {};
            const { access_token, refresh_token } = data;
            return {
              accessToken: access_token,
              refreshToken: refresh_token,
            };
          });
      },
    );

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
  })();
});
