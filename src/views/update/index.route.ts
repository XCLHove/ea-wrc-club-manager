import { defineRoute } from '@/router/router.ts'
import { UPDATE_MENU_LABEL } from '@/menus/900.update.menu.ts'

export default defineRoute({
  name: UPDATE_MENU_LABEL,
  meta: {
    tabLabel: UPDATE_MENU_LABEL,
  },
})
