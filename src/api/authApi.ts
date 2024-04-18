import request from "../utils/request";
import { refreshTokenUtil } from "../utils/refreshTokenUtil.ts";
import { accessTokenUtil } from "../utils/accessTokenUtil.ts";
import { User } from "@/interfaces/User.ts";
import { login } from "@/utils/login.ts";

/**
 * 刷新令牌
 */
export const refreshToken = async () => {
  const refreshTokenValue = refreshTokenUtil.get() || "";
  await window.tokenApi.refresh(refreshTokenValue).then(async (data) => {
    // 没有拿到新的令牌，去官方网站下获取cookie
    if (!data.accessToken) {
      login();
      return Promise.reject("刷新令牌过期！");
    }

    // 成功拿到新的令牌
    const { accessToken, refreshToken } = data;
    refreshTokenUtil.set(refreshToken);
    accessTokenUtil.set(accessToken);
  });
};

/**
 * 获取用户信息
 */
export const profile = () => {
  return request.get("/identity/secured").then(({ data }: { data: User }) => {
    return data;
  }) as Promise<User>;
};

/**
 * 移除刷新令牌
 */
export const removeRefreshToken = async () => {
  accessTokenUtil.remove();
  refreshTokenUtil.remove();
  await window.tokenApi.remove();
};
