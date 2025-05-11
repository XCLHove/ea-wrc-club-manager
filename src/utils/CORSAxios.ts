import axios, { AxiosRequestConfig } from 'axios'

function CORSAxios(config: AxiosRequestConfig) {
  return window.CORS.axios(config)
}

export default CORSAxios
