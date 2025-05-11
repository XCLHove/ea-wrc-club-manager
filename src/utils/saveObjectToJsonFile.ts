export default function saveObjectToJsonFile(object: any, fileName: string) {
  const jsonString = typeof object === 'string' ? object : JSON.stringify(object, null, 2)

  // 创建 Blob 对象
  const blob = new Blob([jsonString], { type: 'application/json' })

  // 创建 URL
  const url = URL.createObjectURL(blob)

  // 创建一个隐藏的 <a> 元素
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = 'language.json' // 设置下载文件的名称

  // 将 <a> 元素添加到页面中
  document.body.appendChild(a)

  // 触发点击事件以下载文件
  a.click()

  // 清理 URL
  URL.revokeObjectURL(url)
}
