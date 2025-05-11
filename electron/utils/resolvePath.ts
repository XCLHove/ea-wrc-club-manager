import * as pathModule from 'path'

function resolvePath(path: string) {
  let base = process.cwd()
  if (!import.meta.env.DEV) {
    base = pathModule.join(base, 'resources')
  }
  return pathModule.join(base, 'public', path)
}

export default resolvePath
