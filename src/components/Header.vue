<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore.ts";
import { computed, ref, Ref } from "vue";
import { User } from "@/interfaces/User.ts";
import { accessTokenUtil } from "@/utils/accessTokenUtil.ts";
import { refreshTokenUtil } from "@/utils/refreshTokenUtil.ts";
import { login } from "@/utils/login.ts";
import { useI18nStore } from "@/stores/useI18nStore.ts";
import { i18nUtil } from "@/utils/i18n.ts";

const pageI18n = (name: string) => {
  return i18nUtil("app.component.header", name);
};

const { user }: { user: Ref<User> } = storeToRefs(useUserStore());
const avatarText = computed(() => {
  return user.value?.displayName.substring(0, 1) || "登录";
});

const logout = async () => {
  accessTokenUtil.remove();
  refreshTokenUtil.remove();
  await window.tokenApi.remove();
  useUserStore().removeUserCache();
  user.value = undefined;
};

const isMobile = defineModel("isMobile", {
  required: true,
});

const showDraper = defineModel<boolean>("showDrawer", {
  required: true,
});

const i18nStore = useI18nStore();
const { locales } = storeToRefs(i18nStore);
</script>

<template>
  <div class="header-container">
    <div class="title">
      <i
        v-if="isMobile"
        class="iconfont icon-menu"
        @click="showDraper = true"
      />
      <el-text class="font-bold">EA WRC</el-text>
      <el-text> Club Manager</el-text>
    </div>
    <div class="locale-switch">
      <el-dropdown>
        <i class="iconfont icon-i18n" style="font-size: 32px"></i>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="localeItem in locales"
              @click="i18nStore.setLocale(localeItem.value)"
            >
              {{ localeItem.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="avatar">
      <el-dropdown>
        <div>
          <el-avatar v-show="!user">{{
            pageI18n("avatar.defaultContent")
          }}</el-avatar>
          <el-avatar v-show="user" :src="user?.preferences?.profileImageUrl">
            {{ avatarText }}
          </el-avatar>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="!user" @click="login">{{
              pageI18n("avatar.dropdownOption.login")
            }}</el-dropdown-item>
            <el-dropdown-item v-if="user" @click="logout">{{
              pageI18n("avatar.dropdownOption.logout")
            }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "@/assets/css/index.less";

.header-container {
  display: flex;
  position: relative;
  align-items: center;
  height: 100%;

  .title {
    position: absolute;
    left: 0;
    margin-left: 10px;

    i {
      font-size: 19px;
      margin: 0 10px 0 0;
      position: relative;
      bottom: 2px;
    }

    .el-text {
      font-size: 25px;
    }

    .font-bold {
      font-weight: bold;
    }
  }

  .locale-switch {
    position: absolute;
    right: 60px;
  }

  .avatar {
    position: absolute;
    right: 0;
    margin-right: 10px;
  }
}
</style>
