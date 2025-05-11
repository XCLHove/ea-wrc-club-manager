function getParentPath(path: string): string {
  const parentPath = path.substring(0, path.lastIndexOf('/'))
  return parentPath
}

export default getParentPath
