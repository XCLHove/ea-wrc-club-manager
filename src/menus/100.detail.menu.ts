import defineMenu from '@/menus/defineMenu.ts'
import { computed } from 'vue'
import { useUserStore } from '@/stores/useUserStore.ts'

export default defineMenu({
  label: 'detail',
  getVisible: () => {
    const userStore = useUserStore()
    return computed(() => userStore.isLogin)
  },
})
