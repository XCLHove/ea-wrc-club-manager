<script setup lang="ts">
import generateLanguageJsonFile from "@/utils/generateLanguageJsonFile";
import { useWindowSize } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import { resolvePath } from "@/utils/pathUtil";
import Vditor from "vditor";
import { elPrompt } from "@/utils/elPrompt";
import { i18nUtil } from "@/utils/i18n";

const pageI18n = (name: string) => {
  return i18nUtil("app.page.translation", name);
};

const height = (() => {
  const { height } = useWindowSize();

  return computed(() => height.value - 100);
})();

const openFolder = () => {
  window.systemApi.openFolder("public/locales");
};

const markdown = ref<HTMLDivElement>();
const getMarkdownText = () => {
  if (!markdown.value) return;
  axios.get(resolvePath("docs/translation.md")).then(({ data }) => {
    Vditor.preview(markdown.value, data, {
      cdn: resolvePath("cdn/vditor"),
      mode: "dark",
    });
  });
};

onMounted(() => {
  getMarkdownText();
});
</script>

<template>
  <div class="i18n-container">
    <div class="button-container">
      <el-button type="primary" @click="generateLanguageJsonFile">
        {{ pageI18n("button.generateLanguageJsonFile") }}
      </el-button>
      <el-button type="success" @click="openFolder">
        {{ pageI18n("button.openFolder") }}
      </el-button>
    </div>
    <el-scrollbar :height="height">
      <div ref="markdown"></div>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="less">
.i18n-container {
  .button-container {
    display: flex;

    .el-button {
      width: 100%;
      margin: 0 10px;
    }
  }
}
</style>
