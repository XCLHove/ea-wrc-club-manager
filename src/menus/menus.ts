import defineMenu from '@/menus/defineMenu.ts'
import getParentPath from '@/utils/getParentPath.ts'
import { type ComputedRef, computed } from 'vue'
import { i18nUtil } from '@/utils/i18n.ts'

const modules = import.meta.glob(['./**/*.menu.ts', '!./menus.ts', '!./defineMenus.ts'], {
  eager: true,
  import: 'default',
})

export type Menu = {
  label: string
  path: string
  children: Menu[]
  getVisible: () => ComputedRef<boolean>
}

export const allMenus: Menu[] = []
Object.entries(modules).map(([path, value]) => {
  path = path.replace(new RegExp('^.'), '')
  path = path.replace(new RegExp('.menu.ts$'), '')
  path = path.replace(new RegExp('/([0-9]+.)'), '/')
  path = path.replace(new RegExp('/+'), '/')
  path = path.toLowerCase()
  const menuOption = value as ReturnType<typeof defineMenu>
  const menu: Menu = {
    label: menuOption.label,
    path: menuOption.path || path,
    children: menuOption.children || [],
    getVisible: (() => {
      const getter = menuOption.getVisible ?? (() => computed(() => true))
      let cache: ReturnType<typeof getter>
      return () => {
        if (!cache) {
          cache = getter()
        }
        return cache
      }
    })(),
  }
  allMenus.push(menu)
})

// 处理嵌套菜单

export const menuMap = new Map<string, Menu>()
allMenus.forEach((menu) => {
  menuMap.set(menu.path, menu)
})
const removeMenuMap = new Map<string, boolean>()
allMenus.forEach((childMenu) => {
  const parentPath = getParentPath(childMenu.path)
  const parentMenu = menuMap.get(parentPath)
  if (!parentMenu) return
  parentMenu.children.push(childMenu)
  removeMenuMap.set(childMenu.path, true)
})
const menus = allMenus.filter((menu) => !removeMenuMap.has(menu.path))
export default menus

export function menuI18n(name: string) {
  return i18nUtil('app.menu', name)
}
