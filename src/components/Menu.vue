<script setup lang="ts">
import { computed } from "vue";
import { menuItems } from "@/router/router.ts";
import { i18nUtil } from "@/utils/i18n.ts";

const defaultActive = computed(() => {
  return window.location.hash.replace(/^#(.*)\?.*/, "$1");
});

const menuPageI18n = (name: string) => {
  return i18nUtil("app.menu", name);
};
</script>

<template>
  <div>
    <el-menu :default-active="defaultActive" router>
      <div v-for="item in menuItems">
        <el-menu-item
          v-if="!item.children"
          :index="item.path"
          :key="item.order"
          >{{ menuPageI18n(item.title) }}</el-menu-item
        >
        <el-sub-menu v-if="item.children" :index="item.path" :key="item.path">
          <template #title>{{ menuPageI18n(item.title) }}</template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.order"
            :index="child.path"
          >
            {{ menuPageI18n(child.title) }}
          </el-menu-item>
        </el-sub-menu>
      </div>
    </el-menu>
  </div>
</template>

<style scoped lang="less">
.el-menu {
  border-right: none;
}
</style>
