<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore.ts";
import { User } from "@/interfaces/User.ts";
import { showPlatform } from "../interfaces/Platform.ts";
import { ref, watch } from "vue";
import { accessTokenUtil } from "@/utils/accessTokenUtil";
import { refreshTokenUtil } from "@/utils/refreshTokenUtil";
import { useClipboard } from "@vueuse/core";
import { elPrompt } from "@/utils/elPrompt";

const { user }: { user: User } = storeToRefs(useUserStore());

const token = ref({
  access: accessTokenUtil.get() || "",
  refresh: refreshTokenUtil.get() || "",
});

const { copy: _copy, copied } = useClipboard();
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
      <el-text class="label"> 名称：</el-text>
      <el-text>
        {{ user?.displayName || "未知" }}
      </el-text>
    </div>
    <div class="detail-item">
      <el-text class="label">平台：</el-text>
      <el-text>
        {{ showPlatform(user?.preferences.providers[0].platform) }}
      </el-text>
    </div>
    <div class="detail-item">
      <el-text class="label">access_token：</el-text>
      <el-button class="token-text" type="text" @click="copy(token.access)">{{
        token.access
      }}</el-button>
    </div>
    <div class="detail-item">
      <el-text class="label">refresh_token：</el-text>
      <el-button class="token-text" type="text" @click="copy(token.refresh)">{{
        token.refresh
      }}</el-button>
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
    }

    .token-text {
      width: 500px;
      white-space: nowrap;
      overflow: hidden;
    }

    .token-text:hover {
      text-decoration: 1px solid var(--el-border-color);
    }
  }
}
</style>
