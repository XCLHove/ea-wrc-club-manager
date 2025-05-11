import defineMenu from '@/menus/defineMenu.ts'
import { useUserStore } from '@/stores/useUserStore.ts'
import { computed } from 'vue'

export default defineMenu({
  label: 'club',
  getVisible: () => {
    const userStore = useUserStore()
    return computed(() => userStore.isLogin)
  },
})
