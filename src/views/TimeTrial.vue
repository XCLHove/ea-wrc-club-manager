<script setup lang="ts">
import {
  getStatsValues,
  timeTrialLeaderBoard,
} from "@/api/timeTrialLeaderBoardApi";
import { StatsValues, SurfaceConditions } from "@/interfaces/StatsValues.ts";
import { computed, onMounted, Ref, ref, watch } from "vue";
import {
  TimeTrialEntry,
  TimeTrialStageLeaderboard,
} from "@/interfaces/TimeTrialStageLeaderboard.ts";
import { useWindowSize } from "@vueuse/core";
import { Platform, platforms } from "@/interfaces/Platform.ts";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore.ts";
import { User } from "@/interfaces/User.ts";

const tableHeight = (() => {
  const { height } = useWindowSize();
  return computed(() => height.value - 180);
})();
const loading = ref(false);

const { user }: { user: Ref<User> } = storeToRefs(useUserStore());
const getTableRowStyle = ({ row }: { row: TimeTrialEntry }) => {
  if (row.ssid !== user.value?.ssid) return {};
  return { "background-color": "rgba(103, 194, 58, .2)" };
};

const statsValues = ref<StatsValues>();
onMounted(async () => {
  statsValues.value = await getStatsValues();
  setCurrentLocationID(statsValues.value?.orderedLocations[0].id);
  params.value.vehicleClassID = statsValues.value?.orderedVehicleClasses[0].id;
  setSurfaceConditions(statsValues.value?.surfaceConditions);
  getLeaderboard();
});

const currentLocationID = ref("");
const currentLocationStages = ref<{ id: string; value: string }[]>([]);
const setCurrentLocationID = (locationID: string) => {
  currentLocationID.value = locationID;

  currentLocationStages.value = [];
  statsValues.value?.locationRoute[locationID].forEach((i) => {
    currentLocationStages.value.push({
      id: i,
      value: statsValues.value?.routes[i],
    });
  });
  params.value.stageID = currentLocationStages.value[0].id;
};

const leaderboard = ref<TimeTrialStageLeaderboard>({
  totalEntrantCount: 0,
});
const params = ref<Parameters<typeof timeTrialLeaderBoard>[0]>({
  stageID: "",
  surfaceConditionID: "",
  vehicleClassID: "",
  platform: Platform.CROSS_PLATFORM,
  cursor: undefined,
  focusOnMe: false,
  maxResultCount: 20,
});
watch(params.value, () => {
  getLeaderboard();
});
const getLeaderboard = () => {
  loading.value = true;

  timeTrialLeaderBoard(params.value)
    .then((data) => {
      leaderboard.value = data;

      loading.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};

const surfaceConditions = ref<{ id: string; value: string }[]>([]);
const setSurfaceConditions = (_surfaceConditions: SurfaceConditions) => {
  for (const id in _surfaceConditions) {
    surfaceConditions.value.push({
      id: id,
      value: _surfaceConditions[id],
    });
  }
  params.value.surfaceConditionID = surfaceConditions.value[0].id;
};

const page = ref({
  current: 1,
  total: 0,
});
watch(
  () => page.value.current,
  (newValue, oldValue) => {
    const number = newValue - oldValue;
    if (number === 0) return;

    if (newValue - oldValue > 0) {
      params.value.cursor = leaderboard.value?.next;
      getLeaderboard();
      return;
    }

    params.value.cursor = leaderboard.value?.previous;
    getLeaderboard();
  },
);
</script>

<template>
  <div class="time-trial-container">
    <div class="options">
      <el-select v-model="currentLocationID" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center"
            >选择分站</el-text
          >
        </template>
        <el-option
          v-for="location in statsValues?.orderedLocations"
          :label="location.value"
          :value="location.id"
          @click="setCurrentLocationID(location.id)"
        />
      </el-select>
      <el-select v-model="params.stageID" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center"
            >选择赛段</el-text
          >
        </template>
        <el-option
          v-for="stage in currentLocationStages"
          :label="stage.value"
          :value="stage.id"
        />
      </el-select>
    </div>
    <div class="options">
      <el-select v-model="params.vehicleClassID" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center"
            >选择组别</el-text
          >
        </template>
        <el-option
          v-for="vehicleClass in statsValues?.orderedVehicleClasses"
          :label="vehicleClass.value"
          :value="vehicleClass.id"
        />
      </el-select>
      <el-select v-model="params.surfaceConditionID" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center"
            >选择路面情况</el-text
          >
        </template>
        <el-option
          v-for="surfaceCondition in surfaceConditions"
          :value="surfaceCondition.id"
          :label="surfaceCondition.value"
        />
      </el-select>
      <el-select v-model="params.platform" :disabled="loading">
        <el-option
          v-for="platform in platforms"
          :label="platform.description"
          :value="platform.value"
        />
      </el-select>
    </div>
    <div class="show-leaderboard" v-loading="loading">
      <el-table
        :data="leaderboard?.entries"
        :height="tableHeight"
        :row-style="getTableRowStyle"
      >
        <el-table-column prop="rank" label="排名" width="75"></el-table-column>
        <el-table-column prop="displayName" label="名称"></el-table-column>
        <el-table-column prop="time" label="时间">
          <template #default="scope">
            {{ scope.row.time.substring(0, 12) }}
          </template>
        </el-table-column>
        <el-table-column prop="differenceToFirst" label="时差">
          <template #default="scope">
            {{ scope.row.time.substring(0, 12) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div>
      <el-pagination
        v-model:disabled="loading"
        v-model:current-page="page.current"
        v-model:page-size="params.maxResultCount"
        v-model:total="leaderboard.totalEntrantCount"
        layout="total, prev, next"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.time-trial-container {
  .options {
    display: flex;
    margin-bottom: 10px;

    & > .el-select {
      margin: 0 5px;
    }
  }
}
</style>
