<template>
  <el-config-provider :locale="zhCn">
    <router-view v-slot="{ Component, route }">
      <div style="display: none">
        {{ setTabComponent(route.path, Component) }}
      </div>
    </router-view>
    <div class="layout-container">
      <div class="header">
        <Header />
      </div>
      <div class="body">
        <div class="menu">
          <el-scrollbar :height="windowHeight - 55">
            <Menu />
          </el-scrollbar>
        </div>
        <div class="content">
          <el-tabs v-model="currentTabPath" type="card" @tab-remove="closeTab">
            <el-tab-pane v-for="tab in tabs" :key="tab.path" :label="menuI18n(tab.label)" :name="tab.path" :closable="tab.path !== HOME_PATH">
              <div class="tab-content" style="height: calc(100vh - 95px); overflow: hidden">
                <Component :is="getTabComponent(tab.path)" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import Header from '@/components/Header.vue'
import menus, { menuI18n, menuMap } from '@/menus/menus.ts'
import { computed, defineAsyncComponent, defineComponent, h, onMounted, ref, watch, type Component } from 'vue'
import { ElMenu, ElMenuItem, ElMessage, ElSubMenu } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { HOME_PATH } from '@/router/router.ts'
import { useWindowSize } from '@vueuse/core'
import routerPush from '@/utils/routerPush.ts'
import { type Menu } from '@/menus/menus.ts'
import useUpdateStore from '@/stores/useUpdateStore.ts'

const route = useRoute()
const router = useRouter()
const { height: windowHeight } = useWindowSize()
window.addEventListener('copy', () => {
  ElMessage.success('复制成功!')
})
onMounted(() => router.push(HOME_PATH))

const Menu = defineComponent({
  setup() {
    const menuList = computed(() => [...menus])

    function getMenuVNode(menu: Menu) {
      if (!menu.getVisible().value) {
        return null
      }

      if (menu.children.length === 0) {
        return h(
          ElMenuItem,
          {
            index: menu.path,
            onClick: () => {
              routerPush(menu.path, menu.label)
            },
          },
          {
            default: () => menuI18n(menu.label),
          },
        )
      }

      return h(
        ElSubMenu,
        {
          index: menu.path,
        },
        {
          title: () => menuI18n(menu.label),
          default: () => menu.children.map((child) => getMenuVNode(child)),
        },
      )
    }

    return () =>
      h(
        ElMenu,
        {
          defaultActive: route.path,
        },
        {
          default: () => menuList.value.map((menu) => getMenuVNode(menu)),
        },
      )
  },
})

type Tab = {
  path: string
  label: string
}
const homeTab: Tab = {
  path: HOME_PATH,
  label: 'home',
}
const closableTabs = ref<Tab[]>([])
const tabs = computed<Tab[]>(() => {
  return [homeTab, ...closableTabs.value]
})
const currentTabPath = ref(route.path)

watch(
  () => currentTabPath.value,
  (path) => router.push(path),
)

router.beforeEach((to, from) => {
  currentTabPath.value = to.path
  if (tabs.value.some((tab) => tab.path === to.path)) return true

  let tabLabel = (to.query.tabLabel as string) || to.meta?.tabLabel || menuMap.get(to.path)?.label || to.name || to.path
  closableTabs.value.push({
    path: to.path,
    label: tabLabel as string,
  })
})

function closeTab(path: string) {
  tabs.value.forEach((tab, index) => {
    if (index === 0) return
    if (tab.path !== path) return
    if (path === currentTabPath.value) {
      currentTabPath.value = tabs.value[index - 1].path
    }

    closableTabs.value = closableTabs.value.filter((tab) => tab.path !== path)
    routeComponentCacheMap.delete(path)
  })
}

const routeComponentSetterMap = new Map<string, (component: Component) => void>()
const routeComponentCacheMap = new Map<string, Component>()
function getTabComponent(path: string) {
  const cacheComponent = routeComponentCacheMap.get(path)
  if (cacheComponent) return cacheComponent

  const component = defineAsyncComponent({
    loader: () =>
      new Promise<Component>((resolve) => {
        routeComponentSetterMap.set(path, resolve)
      }).finally(() => {
        routeComponentSetterMap.delete(path)
      }),
  })
  routeComponentCacheMap.set(path, component)
  return component
}
function setTabComponent(path: string, component: Component) {
  const setter = routeComponentSetterMap.get(path)
  setter?.(component)
}

// 检查更新
onMounted(() => {
  useUpdateStore()
    .checkUpdate()
    .then((updateInfo) => {
      if (updateInfo.available) {
        ElMessage.success('有新版本可用，请及时更新！')
        routerPush('/update')
      }
    })
    .catch((error) => {})
})
</script>

<style lang="less">
.layout-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  > .header {
    height: 50px;
    min-height: 50px;
    border-bottom: var(--el-border);
  }

  > .body {
    flex: 1;
    display: flex;
    flex-direction: row;

    > .menu {
      width: 150px;
      border-right: var(--el-border);

      .el-menu {
        border-right: none;
      }
    }

    > .content {
      flex: 1;
      padding: 1px;

      > .el-tabs {
        > .el-tabs__header {
          margin-bottom: 0;
        }
      }

      .tab-content:first-child {
        padding-top: 1px;
      }
    }
  }
}
</style>
