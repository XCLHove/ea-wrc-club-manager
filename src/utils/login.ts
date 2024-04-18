import { refreshToken, removeRefreshToken } from "@/api/authApi.ts";
import { refreshTokenUtil } from "@/utils/refreshTokenUtil.ts";
import { elPrompt } from "@/utils/elPrompt.ts";

/**
 * 登录
 * @param autoClose 是否自动关闭登录窗口
 */
export const login = (() => {
  let running = false;

  return async (autoClose = true) => {
    if (running) return;
    running = true;

    await removeRefreshToken();
    const closeLoginWindow = window.tokenApi.openLoginWindow(() => {
      console.log("closeLoginWindow");
      running = false;
    });
    const removeListener = window.tokenApi.addListener(({ value }) => {
      refreshTokenUtil.set(value);
      refreshToken()
        .then(() => {
          elPrompt.success("登录成功！");
        })
        .finally(() => {
          removeListener();
          if (autoClose) closeLoginWindow();
          running = false;
        });
    });
  };
})();
