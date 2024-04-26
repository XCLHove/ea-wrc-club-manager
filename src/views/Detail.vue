<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore.ts";
import { User } from "@/interfaces/User.ts";
import { ref, watch } from "vue";
import { accessTokenUtil } from "@/utils/accessTokenUtil";
import { refreshTokenUtil } from "@/utils/refreshTokenUtil";
import { useClipboard } from "@vueuse/core";
import { elPrompt } from "@/utils/elPrompt";
import { platforms } from "../interfaces/Platform";
import { i18nUtil } from "@/utils/i18n";

const pageI18n = (name: string) => {
  return i18nUtil("app.page.detail", name);
};

const { user }: { user: User } = storeToRefs(useUserStore());

const token = ref({
  access: accessTokenUtil.get() || "",
  refresh: refreshTokenUtil.get() || "",
});

const { copy: _copy } = useClipboard();
const copy = (text: string) => {
  _copy(text).then(() => {
    elPrompt.success("复制成功!");
  });
};
</script>

<template>
  <div class="detail-container">
    <div class="image-container">
      <el-image :src="user.preferences.profileImageUrl" alt="" />
    </div>
    <div class="detail-item">
      <el-text class="label"> {{ pageI18n("label.name") }} </el-text>
      <el-text>
        {{ user?.displayName || "未知" }}
      </el-text>
    </div>
    <div class="detail-item">
      <el-text class="label"> {{ pageI18n("label.platform") }} </el-text>
      <el-text>
        {{ platforms[user?.preferences.providers[0].platform] }}
      </el-text>
    </div>
    <div class="detail-item">
      <el-text class="label">
        {{ pageI18n("label.accessToken") }}
      </el-text>
      <el-tooltip
        effect="light"
        :content="pageI18n('prompt.clickToCopy')"
        placement="top"
      >
        <el-button class="token-text" link @click="copy(token.access)">{{
          token.access
        }}</el-button>
      </el-tooltip>
    </div>
    <div class="detail-item">
      <el-text class="label">
        {{ pageI18n("label.refreshToken") }}
      </el-text>
      <el-tooltip
        effect="light"
        :content="pageI18n('prompt.clickToCopy')"
        placement="top"
      >
        <el-button class="token-text" link @click="copy(token.refresh)">{{
          token.refresh
        }}</el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-container {
  .image-container {
    display: flex;
    width: 100%;

    .el-image {
      margin: 0 auto;
      width: 100px;
      height: 100px;
    }
  }

  .detail-item {
    margin: 10px 0;
    width: 100%;
    border-bottom: 1px solid var(--el-border-color);
    display: flex;

    * {
      font-size: 20px;
    }

    .label {
      width: fit-content();

      &::after {
        content: ":";
        margin-right: 10px;
      }
    }

    .token-text {
      width: 500px;
      white-space: nowrap;
      overflow: hidden;
      color: var(--el-color-primary);
    }
  }
}
</style>
