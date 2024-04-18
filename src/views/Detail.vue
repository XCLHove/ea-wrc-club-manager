<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore.ts";
import { User } from "@/interfaces/User.ts";
import { showPlatform } from "../interfaces/Platform.ts";

const { user }: { user: User } = storeToRefs(useUserStore());
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

    * {
      font-size: 20px;
    }

    .label {
      width: 50px;
    }
  }
}
</style>
