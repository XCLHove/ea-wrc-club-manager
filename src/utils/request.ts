import axios, { AxiosError } from "axios";
// @ts-ignore
import { elPrompt } from "./elPrompt";
import { accessTokenUtil } from "./accessTokenUtil.ts";
import { refreshToken } from "../api/authApi.ts";

const request = axios.create({
  baseURL: "https://web-api.racenet.com/api",
  timeout: 30 * 1000,
});

request.interceptors.request.use(
  (config) => {
    config.headers["Content-Type"] ||= "application/json;charset=utf-8";
    config.headers["Authorization"] ||= `Bearer ${accessTokenUtil.get()}`;
    return config;
  },
  (error: Error) => {
    elPrompt.error(`请求出错：${error.message}`);
    return Promise.reject(error);
  },
);

request.interceptors.response.use(
  (response) => {
    return response;
  },
  (() => {
    let onError = false;
    return async (error: AxiosError) => {
      const { response, config } = error;
      if (response?.status === 401) {
        await refreshToken();

        // @ts-ignore
        config.headers.Authorization = `Bearer ${accessTokenUtil.get()}`;
        // @ts-ignore
        return await request.request(config);
      }

      return Promise.reject(error);
    };
  })(),
);

export default request;
