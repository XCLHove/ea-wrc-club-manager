interface SystemApi {
  openFolder: (path?: string) => void;
}

declare global {
  interface Window {
    systemApi: SystemApi;
  }
}
