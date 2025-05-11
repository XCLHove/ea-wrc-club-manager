import { RouteLocationRaw, useRouter } from 'vue-router'
import { router } from '@/router/router.ts'

type Options = ExcludeType<RouteLocationRaw, string>
function routerPush(path: string, tabLabel?: string, options?: Options) {
  options = options || ({} as Options)
  return router.push({
    ...options,
    query: {
      ...options.query,
      tabLabel: tabLabel,
    },
    path,
  })
}

export default routerPush
