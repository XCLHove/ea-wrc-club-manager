export {}

declare global {
  type DownloadUrl = {
    name: string
    url: string
  }

  type UpdateInfo = {
    version: string
    downloadUrl: DownloadUrl[]
    description: string
    updateTime: number
    available: boolean
    file: string
  }
}
