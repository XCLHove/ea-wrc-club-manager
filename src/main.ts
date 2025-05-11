import { createApp } from 'vue'
import App from './App.vue'

import '@/assets/css/base.css'

// Element Plus
import 'element-plus/dist/index.css'
// vue-router
import { router } from '@/router/router.ts'
// pinia
import { createPinia } from 'pinia'
// i18n
import i18n from '@/utils/i18n.ts'

const app = createApp(App)
// vue-router
app.use(router)
// pinia
const pinia = createPinia()
app.use(pinia)
// i18n
app.use(i18n)
app.mount('#app')
