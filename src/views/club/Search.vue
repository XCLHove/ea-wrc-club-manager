<script setup lang="ts">
import { computed, Ref, ref } from "vue";
import { Club, Role } from "@/interfaces/Club.ts";
import getPageSizes from "@/utils/getPageSizes.ts";
import { closeClub, joinClub, leaveClub, searchClub } from "@/api/clubApi.ts";
import { Order, orders, SortBy, sortBys } from "@/interfaces/Search.ts";
import { useClipboard, useWindowSize } from "@vueuse/core";
import { showPlatform } from "@/interfaces/Platform.ts";
import { elPrompt } from "@/utils/elPrompt.ts";

const loading = ref(false);
const clubs: Ref<Club[]> = ref([]);
const searchValue = ref<{
  text: string;
  sort: SortBy;
  order: Order;
}>({
  text: "",
  sort: SortBy.CREATION_DATE,
  order: Order.DESC,
});
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

const search = () => {
  loading.value = true;
  searchClub({
    page: page.value.current,
    pageSize: page.value.pageSize,
    search: searchValue.value.text,
    sort: searchValue.value.sort,
    order: searchValue.value.order,
  })
    .then(({ total, clubs: _clubs }) => {
      clubs.value = _clubs;
      page.value.total = total;
    })
    .finally(() => {
      loading.value = false;
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
const close = (clubId: string) => {
  loading.value = true;
  closeClub(clubId).then(() => {
    search();
  });
};
const leave = (clubId: string) => {
  loading.value = true;
  leaveClub(clubId).then(() => {
    search();
  });
};
const join = (clubId: string) => {
  loading.value = true;
  joinClub(clubId).then(() => {
    search();
  });
};

const tableHeight = (() => {
  const { height } = useWindowSize();
  return computed(() => height.value - 140);
})();
</script>

<template>
  <div>
    <div class="operation">
      <el-input
        class="item"
        v-model="searchValue.text"
        placeholder="俱乐部名称"
        @keydown.enter="search"
      />
      <div style="display: flex">
        <el-text style="width: 35px"> 排序:</el-text>
        <el-select style="width: 110px" class="item" v-model="searchValue.sort">
          <el-option
            v-for="item in sortBys"
            :label="item.description"
            :value="item.value"
          />
        </el-select>
        <el-select style="width: 80px" class="item" v-model="searchValue.order">
          <el-option
            v-for="item in orders"
            :label="item.description"
            :value="item.value"
          />
        </el-select>
      </div>
      <el-button class="item" @click="search" type="primary">搜索</el-button>
    </div>
    <el-table
      :data="clubs"
      style="width: 100%"
      v-loading="loading"
      :height="tableHeight"
    >
      <el-table-column prop="clubName" label="俱乐部名称" width="130">
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
          <el-button type="success" @click="copy(scope.row)"> 复制 </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="pagination"
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

<style scoped>
.operation {
  display: flex;

  .item {
    margin: 0 10px;
  }
}

.link-to-club {
  text-decoration: underline #a3a3a3;
}

.nowrap-hidden {
  white-space: nowrap;
  overflow: hidden;
}

.pagination {
  position: absolute;
  bottom: 10px;
}
</style>
