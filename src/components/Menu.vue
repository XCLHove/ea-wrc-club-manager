<script setup lang="ts">
import { computed } from "vue";

interface MenuItem {
  title: string;
  index: string;
  children?: MenuItem[];
}
const menu: MenuItem[] = [
  {
    title: "俱乐部",
    index: "/club",
    children: [
      {
        title: "我的",
        index: "/club/me",
      },
      {
        title: "搜索",
        index: "/club/search",
      },
      {
        title: "创建",
        index: "/club/create",
      },
      // {
      //   title: "加入",
      //   index: "/club/join",
      // },
    ],
  },
];
const defaultActive = computed(() => {
  return window.location.hash.replace(/^#(.*)\?.*/, "$1");
});
</script>

<template>
  <div>
    <el-menu :default-active="defaultActive" router>
      <el-menu-item index="/">首页</el-menu-item>
      <el-menu-item index="/detail">个人信息</el-menu-item>
      <el-menu-item index="/time-trial">计时赛</el-menu-item>
      <el-sub-menu v-for="item in menu" :key="item" :index="item.index">
        <template #title>{{ item.title }}</template>
        <el-menu-item
          v-for="child in item.children"
          :key="child"
          :index="child.index"
        >
          {{ child.title }}
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<style scoped lang="less">
.el-menu {
  border-right: none;
}
</style>
