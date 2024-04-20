<script setup lang="ts">
import { computed, onMounted, Ref, ref, watch } from "vue";
import { Club, Role } from "@/interfaces/Club.ts";
import getPageSizes from "@/utils/getPageSizes.ts";
import { closeClub, joinClub, leaveClub, pageMyClubs } from "@/api/clubApi.ts";
import { useClipboard, useWindowSize } from "@vueuse/core";
import { showPlatform } from "@/interfaces/Platform.ts";
import { elPrompt } from "@/utils/elPrompt.ts";

const loading = ref(false);
const myClubs: Ref<Club[]> = ref([]);
const page = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  layout: computed(
    (() => {
      const { width } = useWindowSize();
      return () => {
        if (width.value < 500) return "sizes, prev, next";
        return "total, sizes, prev, pager, next";
      };
    })(),
  ),
  pageSizes: computed(() => getPageSizes(page.value.total)),
  handleSizeChange(val: number) {
    this.pageSize = val;
  },
  handleCurrentChange(val: number) {
    this.current = val;
  },
});

const getMyClubs = (() => {
  let running = false;
  return () => {
    if (running) return;
    running = true;
    loading.value = true;
    pageMyClubs({
      page: page.value.current,
      pageSize: page.value.pageSize,
    })
      .then((res) => {
        myClubs.value = res.clubs;
        page.value.total = res.total;
      })
      .finally(() => {
        loading.value = false;
        running = false;
      });
  };
})();
onMounted(getMyClubs);
watch([() => page.value.current, () => page.value.pageSize], () =>
  getMyClubs(),
);
const close = (clubId: string) => {
  loading.value = true;
  closeClub(clubId).then(() => {
    getMyClubs();
  });
};
const leave = (clubId: string) => {
  loading.value = true;
  leaveClub(clubId).then(() => {
    getMyClubs();
  });
};
const join = (clubId: string) => {
  loading.value = true;
  joinClub(clubId).then(() => {
    getMyClubs();
  });
};
const copy = (() => {
  const { copy } = useClipboard();

  return (club: Club) => {
    const { clubName, clubID } = club;
    copy(
      `[${clubName}](https://racenet.com/ea_sports_wrc/clubs/${clubID})`,
    ).then(() => {
      elPrompt.success("复制成功！");
    });
  };
})();

const tableHeight = (() => {
  const { height } = useWindowSize();
  return computed(() => height.value - 110);
})();
</script>

<template>
  <div>
    <el-table
      :data="myClubs"
      style="width: 100%"
      :height="tableHeight"
      v-loading="loading"
    >
      <el-table-column
        prop="clubName"
        label="俱乐部名称"
        width="130"
        fixed="left"
      >
        <template #default="scope">
          <router-link
            class="link-to-club"
            :to="`/club/detail/${scope.row.clubID}`"
          >
            <el-text class="nowrap-hidden" type="info">{{
              scope.row.clubName
            }}</el-text>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column prop="ownerDisplayName" label="所属" width="100">
        <template #default="scope">
          <el-text class="nowrap-hidden" type="info">{{
            scope.row.ownerDisplayName
          }}</el-text>
        </template>
      </el-table-column>
      <el-table-column prop="platfom" label="平台" width="80">
        <template #default="scope">
          {{ showPlatform(scope.row.platform) }}
        </template>
      </el-table-column>
      <el-table-column prop="activeMemberCount" label="人数" width="60" />
      <el-table-column prop="likeCount" label="点赞" width="60" />
      <el-table-column prop="dislikeCount" label="点踩" width="60" />
      <el-table-column fixed="right" width="160" label="操作">
        <template #default="scope">
          <el-button
            v-if="scope.row.role === Role.OWNER"
            type="danger"
            @click="close(scope.row.clubID)"
          >
            解散
          </el-button>
          <el-button
            v-if="scope.row.role === Role.MEMBER"
            type="warning"
            @click="leave(scope.row.clubID)"
          >
            退出
          </el-button>
          <el-button
            v-if="scope.row.role === Role.NO_JOIN"
            type="success"
            @click="join(scope.row.clubID)"
          >
            加入
          </el-button>
          <el-button type="success" @click="copy(scope.row)"> 复制</el-button>
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

.el-pagination {
  position: absolute;
  bottom: 10px;
}
</style>
