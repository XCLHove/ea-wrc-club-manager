<script setup lang="ts">
import { clubDetail, stageLeaderboard } from "@/api/clubApi";
import { useRoute } from "vue-router";
import { computed, onMounted, Ref, ref, watch } from "vue";
import {
  ClubDetail,
  Stage,
  Stand,
  StandStatus,
  StandStatusMap,
  TotalTimeEntry,
} from "@/interfaces/ClubDetail";
import { ChampionshipEntry } from "@/interfaces/ChampionshipStageLeaderboard.ts";
import { Platform } from "@/interfaces/Platform.ts";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore.ts";
import { User } from "@/interfaces/User.ts";
import { useWindowSize } from "@vueuse/core";
import { TimeTrialEntry } from "@/interfaces/TimeTrialStageLeaderboard.ts";

const tableHeight = (() => {
  const { height } = useWindowSize();

  return computed(() => height.value - 150);
})();

const loading = ref(false);

// 俱乐部ID
const { clubId } = useRoute().params as { clubId: string };
// 用户信息
const { user }: { user: Ref<User> } = storeToRefs(useUserStore());
const getTableRowStyle = ({ row }: { row: TimeTrialEntry }) => {
  if (row.ssid !== user.value?.ssid) return {};
  return { "background-color": "rgba(103, 194, 58, .2)" };
};
// 分站
const stands = ref<Stand[]>([]);
onMounted(() => {
  clubDetail(clubId).then((club: ClubDetail) => {
    stands.value = club.currentChampionship.events || [];
    stands.value.forEach((stand) => {
      if (stand.status === StandStatus.RUNNING) changeStand(stand);
    });
  });
});
// 当前分站
const currentStandID = ref<string>("");
const currentStand = ref<Stand>({});
// 切换分站
const changeStand = (stand: Stand) => {
  if (!stand) return;
  currentStand.value.totalTimeLeaderboard = totalTimeLeaderboard.value;
  totalTimeLeaderboard.value = stand.totalTimeLeaderboard || [];

  currentStand.value = stand;
  currentStandID.value = stand.id;

  changeStage(stand.stages?.[0]);
};

// 当前赛段
const currentStageLeaderboardID = ref<string>("");
const currentStage = ref<Stage>({});
const changeStage = (stage: Stage) => {
  if (!stage) return;

  currentStage.value = stage;
  currentStageLeaderboardID.value = stage.leaderboardID;

  getStageLeaderboard();
};

// 获取赛段排名
const getStageLeaderboard = () => {
  loading.value = true;
  if (!user.value) {
    const stopWatch = watch(
      () => user.value,
      () => {
        stopWatch();
        getStageLeaderboard();
      },
    );
    return;
  }

  if (currentStage.value?.entries !== undefined) {
    loading.value = false;
    return;
  }

  let _currentLeaderboard: ChampionshipEntry[] = [];
  let savedSelf = false;
  const getData = (nextCursor?: string) => {
    stageLeaderboard({
      clubId: clubId,
      stageLeaderboardID: currentStage.value.leaderboardID,
      SortCumulative: false,
      MaxResultCount: 20,
      FocusOnMe: false,
      Platform: Platform.CROSS_PLATFORM,
      Cursor: nextCursor,
    }).then(
      ({ entries, next }: { entries: ChampionshipEntry[]; next: string }) => {
        // 避免重复存储自己的记录
        entries = entries.filter((entry) => {
          if (!savedSelf && entry.ssid === user.value.ssid) {
            savedSelf = true;
            return entry;
          }

          return entry.ssid !== user.value.ssid;
        });
        _currentLeaderboard = [..._currentLeaderboard, ...entries];
        // 如果有下一页就继续获取下一页
        if (next) {
          getData(next);
          return;
        }

        // 按排名排序
        let selfEntry: ChampionshipEntry = void 0;
        _currentLeaderboard = _currentLeaderboard.filter((entry) => {
          if (entry.ssid !== user.value.ssid) {
            return entry;
          }
          selfEntry = entry;
        });
        if (selfEntry) {
          _currentLeaderboard = [
            ..._currentLeaderboard.slice(0, selfEntry.rank - 1),
            selfEntry,
            ..._currentLeaderboard.slice(selfEntry.rank - 1),
          ];
        }
        // 把当前赛段排行榜存到赛段信息中
        currentStage.value.entries = [..._currentLeaderboard];
        // 把当前赛段信息存到当前分站信息中
        currentStand.value.stages = currentStand.value.stages.filter(
          (stage) => {
            if (stage.id === currentStage.value.id) {
              return currentStage.value;
            }
            return stage;
          },
        );
        // 把当前分站信息存到分站列表中
        stands.value = stands.value.filter((stand) => {
          if (stand.id === currentStand.value.id) {
            return currentStand.value;
          }
          return stand;
        });
        //计算已加载排行榜的总时间
        saveTotalTimeLeaderboard(_currentLeaderboard);

        loading.value = false;
      },
    );
  };

  getData();
};

const showStand = (stand: string) => {
  return stand.replace(/^.*Rally/, "");
};

const showTotalTime = ref(false);

// 统计已经加载赛段的总时间
const totalTimeLeaderboard = ref<TotalTimeEntry[]>([]);
const formatNumberToTime = (ms: number) => {
  return new Date(ms).toISOString().substring(11, 23);
};
const saveTotalTimeLeaderboard = (() => {
  let totalTimesMap = new Map<string, { name: string; time: number }>();
  let isFirstSave = true;

  const parseTimeToNumber = (time: string) => {
    let timeNumber = 0;
    const strings: string[] = time.split(":");
    let index = 0;
    timeNumber += parseInt(strings[index++]) * 60 * 60 * 1000;
    timeNumber += parseInt(strings[index++]) * 60 * 1000;
    timeNumber += Math.ceil(parseFloat(strings[index++]) * 1000);
    return timeNumber;
  };
  const getTotalTimeLeaderboard = () => {
    let minTime: number = void 0;
    totalTimesMap.forEach(({ time }) => {
      minTime = minTime === void 0 ? time : minTime;
      minTime = Math.min(minTime, time);
    });

    const _totalTimes: TotalTimeEntry[] = [];
    totalTimesMap.forEach(({ name, time }, ssid) => {
      const differenceToFirst = time - minTime;
      _totalTimes.push({
        name: name,
        time: time,
        differenceToFirst: differenceToFirst,
        rank: 0,
        ssid: ssid,
      });
    });
    return _totalTimes
      .sort((a, b) => {
        return a.time - b.time;
      })
      .filter((item, index) => {
        item.rank = index + 1;
        return item;
      });
  };

  return (entries: ChampionshipEntry[]) => {
    const newTotalTimesMap = new Map<string, { name: string; time: number }>();

    entries.forEach((value) => {
      const { ssid, displayName, time } = value;
      if (isFirstSave) {
        newTotalTimesMap.set(ssid, {
          name: displayName,
          time: parseTimeToNumber(time),
        });
        return;
      }

      const lastRecord = totalTimesMap.get(ssid);
      if (lastRecord) {
        lastRecord.time += parseTimeToNumber(time);
        newTotalTimesMap.set(ssid, lastRecord);
      }
    });

    totalTimesMap = newTotalTimesMap;
    isFirstSave = false;

    totalTimeLeaderboard.value = getTotalTimeLeaderboard();
  };
})();
</script>

<template>
  <div class="detail-container">
    <div class="operation-container">
      <el-radio-group
        style="width: 250px"
        class="stand-select"
        v-model="showTotalTime"
      >
        <el-radio-button :value="false">当前赛段</el-radio-button>
        <el-radio-button :value="true">总时间</el-radio-button>
      </el-radio-group>

      <el-select v-model="currentStandID">
        <el-option
          v-for="stand in stands"
          :value="stand.id"
          :disabled="stand.id === currentStandID"
          :label="`${stand.eventSettings.location}(${StandStatusMap[stand.status]})`"
        >
          <div @click="changeStand(stand)">
            <el-text
              type="success"
              v-if="stand.status === StandStatus.FINISHED"
            >
              {{
                `${stand.eventSettings.location}(${StandStatusMap[stand.status]})`
              }}
            </el-text>
            <el-text
              type="primary"
              v-else-if="stand.status === StandStatus.RUNNING"
            >
              {{
                `${showStand(stand.eventSettings.location)}(${StandStatusMap[stand.status]})`
              }}
            </el-text>
            <el-text type="info" v-else>
              {{
                `${showStand(stand.eventSettings.location)}(${StandStatusMap[stand.status]})`
              }}
            </el-text>
          </div>
        </el-option>
      </el-select>
    </div>
    <div class="operation-container">
      <el-radio-group :disabled="loading" v-model="currentStageLeaderboardID">
        <el-radio-button
          v-for="(stage, i) in currentStand?.stages"
          :value="stage.leaderboardID"
          @change="changeStage(stage)"
          size="small"
          >SS {{ i + 1 }}</el-radio-button
        >
      </el-radio-group>
    </div>
    <div v-show="showTotalTime">
      <el-table
        v-loading="loading"
        v-model:data="totalTimeLeaderboard"
        :height="tableHeight"
        :row-style="getTableRowStyle"
      >
        <el-table-column prop="rank" label="排名" />
        <el-table-column prop="name" label="名字" />
        <el-table-column prop="time" label="总时间">
          <template #default="scope">
            {{ formatNumberToTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="differenceToFirst" label="总时差">
          <template #default="scope">
            {{ formatNumberToTime(scope.row.differenceToFirst) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-show="!showTotalTime">
      <el-table
        v-loading="loading"
        v-model:data="currentStage.entries"
        :height="tableHeight"
        :row-style="getTableRowStyle"
      >
        <el-table-column prop="rank" label="排名" />
        <el-table-column prop="displayName" label="名字" />
        <el-table-column prop="time" label="时间">
          <template #default="scope">
            {{ scope.row.time.substring(0, 12) }}
          </template>
        </el-table-column>
        <el-table-column prop="differenceToFirst" label="差时">
          <template #default="scope">
            {{ scope.row.differenceToFirst.substring(0, 12) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-container {
  .operation-container {
    display: flex;
    margin-bottom: 10px;

    .stand-select {
      width: 200px;
    }
  }
}
.a {
  color: #dcdcdc;
}
</style>
