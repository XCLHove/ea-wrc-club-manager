import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import getParentPath from '@/utils/getParentPath.ts'

export const HOME_PATH = '/home' as const

const pageModules = import.meta.glob('../views/**/index.vue', {})
const pageRouteModules = import.meta.glob('../views/**/index.route.ts', {
  eager: true,
  import: 'default',
})
const allRoutes: RouteRecordRaw[] = []
const pageRouteMapArray = Object.entries(pageRouteModules).map(([path, meta]) => {
  path = path.replace(new RegExp('^../views'), '')
  path = path.replace(new RegExp('.route.ts$'), '')
  path = path.replace(new RegExp('index', 'g'), '')
  path = path.replace(new RegExp('/+', 'g'), '/')
  path = path.replace(new RegExp('^(.+)/$'), '$1')
  path = path.replace(/\[([^\]]+)]/g, ':$1')
  return [path, meta as RouteRecordRaw] as const
})
const pageRouteMap = new Map<string, RouteRecordRaw>(pageRouteMapArray)
Object.entries(pageModules).map(([path, component]) => {
  path = path.replace(new RegExp('^../views'), '')
  path = path.replace(new RegExp('.vue$'), '')
  path = path.replace(new RegExp('index', 'g'), '')
  path = path.replace(new RegExp('/+', 'g'), '/')
  path = path.replace(new RegExp('^(.+)/$'), '$1')
  path = path.replace(/\[([^\]]+)]/g, ':$1')

  const routeExtra = pageRouteMap.get(path) || {}
  const route: RouteRecordRaw = {
    ...routeExtra,
    path: path,
    component: component as any,
    children: [],
  }
  allRoutes.push(route)
})
const routeMap = new Map<string, RouteRecordRaw>(allRoutes.map((route) => [route.path, route]))
const removeRouteMap = new Map<string, boolean>()
allRoutes.forEach((route) => {
  const parentPath = getParentPath(route.path)
  const parentRoute = routeMap.get(parentPath)
  if (!parentRoute) return
  parentRoute.children ||= []
  parentRoute.children.push(route)
  removeRouteMap.set(route.path, true)
})

const homeRoute: RouteRecordRaw = {
  path: '/',
  redirect: HOME_PATH,
}
const routes: RouteRecordRaw[] = [homeRoute, ...allRoutes.filter((route) => !removeRouteMap.has(route.path))]

export const router = createRouter({
  history: createWebHashHistory(),
  routes: routes,
})

export function defineRoute(route: Partial<RouteRecordRaw>) {
  return route
}
