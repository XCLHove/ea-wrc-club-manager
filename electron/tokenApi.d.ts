export interface TokenApi {
  /**
   * 当刷新令牌发生变化时
   * @param callback 发生变化时的回调
   * @return removeListener 取消监听的函数
   */
  addListener: (callback: (cookie: Electron.Cookie) => void) => () => void;
  /**
   * 移除cookie中的刷新令牌
   */
  remove: () => Promise<void>;
  /**
   * 获取新的刷新令牌和访问令牌
   * @param refreshToken 旧的刷新令牌
   */
  refresh: (refreshToken: string) => Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  /**
   * 打开登录窗口
   * @param closeCallback 登录窗口关闭时的回调
   * @return closeLoginWindow 关闭登录窗口的函数
   */
  openLoginWindow: (closeCallback?: () => void) => () => void;
}

declare global {
  interface Window {
    /**自定义api*/
    tokenApi: TokenApi;
  }
}
