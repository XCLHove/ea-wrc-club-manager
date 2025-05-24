<script setup lang="ts">
import { computed, onMounted, Ref, ref, watch } from 'vue'
import { Club, Role } from '@/interfaces/Club.ts'
import getPageSizes from '@/utils/getPageSizes.ts'
import { closeClub, joinClub, leaveClub, pageMyClubs } from '@/api/clubApi.ts'
import { useClipboard, useWindowSize } from '@vueuse/core'
import { platforms } from '@/interfaces/Platform.ts'
import { elPrompt } from '@/utils/elPrompt.ts'
import { i18nUtil } from '@/utils/i18n'
import routerPush from '@/utils/routerPush'

const pageI18n = (name: string) => {
  return i18nUtil('app.page.clubMe', name)
}

const loading = ref(false)
const myClubs: Ref<Club[]> = ref([])
const page = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  layout: computed(
    (() => {
      const { width } = useWindowSize()
      return () => {
        if (width.value < 500) return 'sizes, prev, next'
        return 'total, sizes, prev, pager, next'
      }
    })(),
  ),
  pageSizes: computed(() => getPageSizes(page.value.total)),
  handleSizeChange(val: number) {
    this.pageSize = val
  },
  handleCurrentChange(val: number) {
    this.current = val
  },
})

const getMyClubs = (() => {
  let running = false
  return () => {
    if (running) return
    running = true
    loading.value = true
    pageMyClubs({
      page: page.value.current,
      pageSize: page.value.pageSize,
    })
      .then((res) => {
        myClubs.value = res.clubs
        page.value.total = res.total
      })
      .finally(() => {
        loading.value = false
        running = false
      })
  }
})()
onMounted(getMyClubs)
watch([() => page.value.current, () => page.value.pageSize], () => getMyClubs())
const close = (clubId: string) => {
  loading.value = true
  closeClub(clubId).then(() => {
    getMyClubs()
  })
}
const leave = (clubId: string) => {
  loading.value = true
  leaveClub(clubId).then(() => {
    getMyClubs()
  })
}
const join = (clubId: string) => {
  loading.value = true
  joinClub(clubId).then(() => {
    getMyClubs()
  })
}
const copy = (() => {
  const { copy } = useClipboard()

  return (club: Club) => {
    const { clubName, clubID } = club
    copy(`[${clubName}](https://racenet.com/ea_sports_wrc/clubs/${clubID})`).then(() => {
      elPrompt.success(pageI18n('prompt.copySuccess'))
    })
  }
})()

const tableHeight = (() => {
  const { height } = useWindowSize()
  return computed(() => height.value - 140)
})()

const showClubDetail = (club: Club) => {
  routerPush(`/club/detail/${club.clubID}`, club.clubName)
}
</script>

<template>
  <div class="my-clubs">
    <el-table :data="myClubs" style="width: 100%" :height="tableHeight" v-loading="loading">
      <el-table-column prop="clubName" :label="pageI18n('columnName.clubName')" fixed="left" show-overflow-tooltip>
        <template #default="scope">
          <el-button link class="link-to-club" @click="showClubDetail(scope.row)">
            <el-text class="nowrap-hidden" type="info">{{ scope.row.clubName }}</el-text>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="ownerDisplayName" :label="pageI18n('columnName.ownerName')" width="140">
        <template #default="scope">
          <el-text class="nowrap-hidden">{{ scope.row.ownerDisplayName }}</el-text>
        </template>
      </el-table-column>
      <el-table-column prop="platform" :label="pageI18n('columnName.platform')" width="120">
        <template #default="scope">
          <el-text class="nowrap-hidden">
            {{ pageI18n(`platform.${platforms[scope.row.platform]}`) }}
          </el-text>
        </template>
      </el-table-column>
      <el-table-column prop="activeMemberCount" :label="pageI18n('columnName.memberCount')" min-width="70" />
      <el-table-column fixed="right" width="180" :label="pageI18n('columnName.operation')">
        <template #default="scope">
          <el-button v-if="scope.row.role === Role.OWNER" type="danger" @click="close(scope.row.clubID)">
            {{ pageI18n('button.close') }}
          </el-button>
          <el-button v-if="scope.row.role === Role.MEMBER" type="warning" @click="leave(scope.row.clubID)">
            {{ pageI18n('button.leave') }}
          </el-button>
          <el-button type="success" @click="copy(scope.row)">
            {{ pageI18n('button.copy') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      style="margin-top: 10px"
      v-model:layout="page.layout"
      v-model:current-page="page.current"
      v-model:page-size="page.pageSize"
      v-model:total="page.total"
      v-model:disabled="loading"
      v-model:page-sizes="page.pageSizes"
      @size-change="page.handleSizeChange"
      @current-change="page.handleCurrentChange"
    />
  </div>
</template>

<style lang="less" scoped>
.link-to-club {
  text-decoration: underline #a3a3a3;
}

.nowrap-hidden {
  white-space: nowrap;
  overflow: hidden;
}

.my-clubs {
  display: flex;
  flex-direction: column;
}
</style>
