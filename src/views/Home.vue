<script setup lang="ts">
import Vditor from "vditor";
import "vditor/src/assets/less/index.less";
import { computed, onMounted, ref } from "vue";
import { useWindowSize } from "@vueuse/core";
import axios from "axios";
import { resolvePath } from "@/utils/pathUtil.ts";

const markdown = ref<HTMLDivElement>();
const getMarkdownText = () => {
  if (!markdown.value) return;
  axios.get(resolvePath("readme.md")).then(({ data }) => {
    Vditor.preview(markdown.value, data, {
      cdn: resolvePath("cdn/vditor"),
      mode: "dark",
    });
  });
};

onMounted(() => {
  getMarkdownText();
});

const height = (() => {
  const { height } = useWindowSize();

  return computed(() => height.value - 75);
})();

const test = () => {};
</script>

<template>
  <!--<el-button @click="test">test</el-button>-->
  <div>
    <el-scrollbar :height="height">
      <div ref="markdown"></div>
    </el-scrollbar>
  </div>
</template>

<style lang="less" scoped></style>
