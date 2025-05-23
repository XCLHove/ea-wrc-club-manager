const ChannelKey = {
  REFRESH_ACCESS_TOKEN: 'refresh:access_token',
  OPEN_LOGIN_WINDOW: 'open:login_window',
  OPEN_FOLDER: 'open:folder',
  GET_VERSION: 'get-version',
  UPDATE_AVAILABLE: 'update-available',
  CHECK_UPDATE: 'check-update',
  DOWNLOAD_UPDATE: 'download-update',
  INSTALL_UPDATE: 'install-update',
  DOWNLOAD_PROGRESS: 'download-progress',
  CANCEL_DOWNLOAD: 'cancel-download',
  AXIOS: 'axios',
} as const
export default ChannelKey
