<template>
  <div class="layout-container">
    <!--header-->
    <div class="header">
      <Header v-model:is-mobile="isMobile" v-model:show-drawer="showDrawer" />
    </div>
    <!--content-container-->
    <div class="content-container">
      <!--menu-->
      <div class="drawer-menu" v-if="isMobile">
        <el-drawer
          v-model="showDrawer"
          direction="ltr"
          title="菜单"
          custom-class="drawer-container"
          size="150"
        >
          <Menu />
        </el-drawer>
      </div>
      <div class="aside-menu" v-else>
        <Menu />
      </div>
      <!--content-->
      <div class="content">
        <router-view />
      </div>
    </div>
    <Login />
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import { useWindowSize } from "@vueuse/core";
import { computed, ref } from "vue";
import Menu from "@/components/Menu.vue";
import Login from "@/components/Login.vue";

const isMobile = computed(
  (() => {
    const { width } = useWindowSize();
    return () => width.value < 500;
  })(),
);
const showDrawer = ref(false);
</script>

<style lang="less" scoped>
@containerHeight: 100vh;
@headerHeight: 50px;
@contentHeight: calc(@containerHeight - @headerHeight);

.layout-container {
  width: 100%;
  height: @containerHeight;

  .header {
    width: 100%;
    height: @headerHeight;
    position: relative;
    border-bottom: 1px solid var(--el-border-color);
  }

  .content-container {
    width: 100%;
    height: @contentHeight;
    position: relative;
    display: flex;

    @asideMenuWidth: 120px;
    @contentWidth: calc(100% - @asideMenuWidth);
    .aside-menu {
      width: @asideMenuWidth;
      height: @contentHeight;
      border-right: 1px solid var(--el-border-color);
    }

    .content {
      width: 100%;
      position: relative;
      padding: 10px;

      @media screen and (max-width: 500px) {
        .content {
          width: 100%;
        }
      }
    }
  }
}
</style>
