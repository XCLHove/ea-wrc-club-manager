<script setup lang="ts">
import { computed, Ref, ref } from "vue";
import { Club, Role } from "@/interfaces/Club.ts";
import getPageSizes from "@/utils/getPageSizes.ts";
import { closeClub, joinClub, leaveClub, searchClub } from "@/api/clubApi.ts";
import { Order, orders, SortBy, sortBys } from "@/interfaces/Search.ts";
import { useClipboard, useWindowSize } from "@vueuse/core";
import { elPrompt } from "@/utils/elPrompt.ts";
import { platforms } from "@/interfaces/Platform";
import { i18nUtil } from "@/utils/i18n";

const pageI18n = (name: string) => {
  return i18nUtil("app.page.clubSearch", name);
};

const loading = ref(false);
const clubs: Ref<Club[]> = ref([]);
const searchValue = ref<{
  text: string;
  sort: SortBy;
  order: Order;
}>({
  text: "",
  sort: SortBy.CREATION_DATE.toString(),
  order: Order.DESC.toString(),
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
        :placeholder="pageI18n('inputPrompt')"
        @keydown.enter="search"
      />
      <div style="display: flex">
        <el-text style="width: 35px">{{ pageI18n("sortByLabel") }}:</el-text>
        <el-select style="width: 110px" class="item" v-model="searchValue.sort">
          <el-option
            v-for="(_, key) in sortBys"
            :label="pageI18n(`sortBy.${sortBys[key]}`)"
            :value="key"
          />
        </el-select>
        <el-select style="width: 80px" class="item" v-model="searchValue.order">
          <el-option
            v-for="(_, key) in orders"
            :label="pageI18n(`orderBy.${orders[key]}`)"
            :value="key"
          />
        </el-select>
      </div>
      <el-button class="item" @click="search" type="primary">{{
        pageI18n("button.search")
      }}</el-button>
    </div>
    <el-table
      :data="clubs"
      style="width: 100%"
      v-loading="loading"
      :height="tableHeight"
    >
      <el-table-column
        prop="clubName"
        :label="pageI18n('columnName.clubName')"
        width="130"
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
      <el-table-column
        prop="ownerDisplayName"
        :label="pageI18n('columnName.ownerName')"
        width="100"
      >
        <template #default="scope">
          <el-text class="nowrap-hidden" type="info">{{
            scope.row.ownerDisplayName
          }}</el-text>
        </template>
      </el-table-column>
      <el-table-column
        prop="platform"
        :label="pageI18n('columnName.platform')"
        width="80"
      >
        <template #default="scope">
          <el-text class="nowrap-hidden" type="info">{{
            platforms[scope.row.platform]
          }}</el-text>
        </template>
      </el-table-column>
      <el-table-column
        prop="activeMemberCount"
        :label="pageI18n('columnName.count')"
        width="60"
      />
      <el-table-column
        prop="likeCount"
        :label="pageI18n('columnName.like')"
        width="55"
      />
      <el-table-column
        prop="dislikeCount"
        :label="pageI18n('columnName.dislike')"
        width="55"
      />
      <el-table-column
        fixed="right"
        width="170"
        :label="pageI18n('columnName.operation')"
      >
        <template #default="scope">
          <el-button
            v-if="scope.row.role === Role.OWNER"
            type="danger"
            @click="close(scope.row.clubID)"
          >
            {{ pageI18n("button.close") }}
          </el-button>
          <el-button
            v-if="scope.row.role === Role.MEMBER"
            type="warning"
            @click="leave(scope.row.clubID)"
          >
            {{ pageI18n("button.leave") }}
          </el-button>
          <el-button
            v-if="scope.row.role === Role.NO_JOIN"
            type="primary"
            @click="join(scope.row.clubID)"
          >
            {{ pageI18n("button.join") }}
          </el-button>
          <el-button type="success" @click="copy(scope.row)">
            {{ pageI18n("button.copy") }}
          </el-button>
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
