<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/useUserStore.ts'
import { computed, onBeforeMount, ref } from 'vue'
import { accessTokenUtil } from '@/utils/accessTokenUtil.ts'
import { refreshTokenUtil } from '@/utils/refreshTokenUtil.ts'
import { useI18nStore } from '@/stores/useI18nStore.ts'
import { i18nUtil } from '@/utils/i18n.ts'
import { loginApi } from '@/api/authApi.ts'

const pageI18n = (name: string) => {
  return i18nUtil('app.component.header', name)
}

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const avatarText = computed(() => {
  if (!user.value) return '登录'
  return user.value.displayName.substring(0, 1)
})

const logout = () => {
  return userStore.logout()
}

const i18nStore = useI18nStore()
const { locales } = storeToRefs(i18nStore)

const version = ref('')
onBeforeMount(() => refreshVersion())

function refreshVersion() {
  window.appApi.getVersion().then((v) => {
    version.value = v
  })
}

function login() {
  return userStore.login()
}
</script>

<template>
  <div class="header-container">
    <el-tooltip effect="light" :content="version" placement="right">
      <div class="title">
        <el-text class="font-bold">EA WRC</el-text>
        <el-text> Club Manager</el-text>
      </div>
    </el-tooltip>
    <div class="locale-switch">
      <el-dropdown>
        <img src="@/assets/icon/i18n.svg" alt="i18n.svg" style="height: 32px" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="localeItem in locales" @click="i18nStore.setLocale(localeItem.value)">
              {{ localeItem.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="avatar">
      <el-dropdown>
        <div>
          <el-avatar v-show="!user">{{ pageI18n('avatar.defaultContent') }}</el-avatar>
          <el-avatar v-show="user" :src="user?.preferences?.profileImageUrl">
            {{ avatarText }}
          </el-avatar>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="!user" @click="login">{{ pageI18n('avatar.dropdownOption.login') }}</el-dropdown-item>
            <el-dropdown-item v-if="user" @click="logout">{{ pageI18n('avatar.dropdownOption.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '@/assets/css/index.less';

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
