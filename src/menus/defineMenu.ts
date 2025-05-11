import { Menu } from '@/menus/menus.ts'

type MenuOption = Prettify<Optional<Menu, 'path' | 'children' | 'getVisible'>>
function defineMenu(menu: MenuOption) {
  return menu
}

export default defineMenu
