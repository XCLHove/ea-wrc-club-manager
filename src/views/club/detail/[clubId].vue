<script setup lang="ts">
import {
  clubDetail as getClubDetail,
  getChampionship,
  stageLeaderboard,
} from "@/api/clubApi";
import { useRoute } from "vue-router";
import { computed, h, onMounted, Ref, ref } from "vue";
import {
  ClubDetail,
  Stage,
  Location,
  Championship,
  LocationStatus,
} from "@/interfaces/ClubDetail";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/useUserStore.ts";
import { User } from "@/interfaces/User.ts";
import { useWindowSize } from "@vueuse/core";
import { TimeTrialEntry } from "@/interfaces/TimeTrialStageLeaderboard.ts";
import { accessLevels } from "../../../interfaces/Club";
import { ElDialog, ElScrollbar, Instance } from "element-plus";
import { i18nUtil } from "../../../utils/i18n";
import { Platform } from "@/interfaces/Platform";
import { LeaderboardItem } from "@/interfaces/ChampionshipStageLeaderboard";
import { elPrompt } from "@/utils/elPrompt";
import { exportToExcel } from "@/views/exportToExcel";
import Analysis from "@/components/Analysis.vue";

const pageI18n = (name: string) => {
  return i18nUtil("app.page.clubDetail", name);
};

const tableHeight = (() => {
  const { height } = useWindowSize();

  return computed(() => height.value - 230);
})();

const showLeaderboard = ref(false);

// 俱乐部ID
const { clubId } = useRoute().params as { clubId: string };
// 用户信息
const { user }: { user: Ref<User> } = storeToRefs(useUserStore());
// 俱乐部信息
const clubDetail = ref<ClubDetail>();
// 当前锦标赛
const currentChampionship = ref<Championship>();
const currentChampionshipID = ref("");
// 当前分站
type NewLocation = Location & {
  totalFinishCount?: TypeFinishCount[];
  totalTimeLeaderBoard?: TypeTotalTime[];
};
const currentLocation = ref<NewLocation>();
const currentLocationID = ref("");
// 当前赛段
const currentStage = ref<Stage>();
const currentStageID = ref("");
// 当前赛段排行榜
const currentStageLeaderBoard = ref<LeaderboardItem[]>([]);
// 已加载赛段总时间排行榜
type TypeTotalTime = {
  ssid: string;
  displayName: string;
  totalTime: number;
  differenceToFirst: number;
  rank: number;
};
const currentLocationTotalTimeLeaderBoard = ref<TypeTotalTime[]>([]);
// 当前分站完赛赛段数（仅包含已加载赛段）
type TypeFinishCount = {
  ssid: string;
  displayName: string;
  count: number;
};
const currentLocationFinishedStageCount = ref<TypeFinishCount[]>([]);
// 获取俱乐部信息
const loadingClubDetail = ref(false);
onMounted(() => {
  loadingClubDetail.value = true;
  getClubDetail(clubId)
    .then((club: ClubDetail) => {
      setClubDetail(club);
    })
    .finally(() => {
      loadingClubDetail.value = false;
    });
});
const setClubDetail = (club: ClubDetail) => {
  clubDetail.value = club;
  setCurrentChampionship(club.currentChampionship);
};
const saveClubDetail = () => {
  // 保存到分站信息
  currentLocation.value.stages.forEach((item, index) => {
    if (item.id !== currentStage.value.id) return;
    currentLocation.value.stages[index] = currentStage.value;
  });
  // 保存到赛事信息
  currentChampionship.value.events.forEach((item, index) => {
    if (item.id !== currentLocation.value.id) return;
    currentChampionship.value.events[index] = currentLocation.value;
  });
  // 保存到俱乐部信息
  clubDetail.value.championships[currentChampionship.value.id] =
    currentChampionship.value;
};
const loadingChampionship = ref(false);
const loadChampionship = (id: string) => {
  let championship = clubDetail.value.championships[id];
  if (championship) {
    setCurrentChampionship(championship);
    return;
  }

  loadingChampionship.value = true;
  getChampionship(id)
    .then((championship) => {
      setCurrentChampionship(championship);
    })
    .catch(({ message }) => {
      elPrompt.error(message);
    })
    .finally(() => {
      loadingChampionship.value = false;
    });
};
const setCurrentChampionship = (championship: Championship) => {
  if (!championship) return;
  clubDetail.value.championships ||= {};
  clubDetail.value.championships[championship.id] = championship;
  currentChampionship.value = championship;
  currentChampionshipID.value = championship.id;

  let location = championship.events?.[0];
  championship.events?.forEach((item) => {
    if (item.status !== LocationStatus.RUNNING) return;
    location = item;
  });
  setCurrentLocation(location);
};
const setCurrentLocation = (location: NewLocation) => {
  currentLocation.value = location;
  currentLocationID.value = location.id;
  setCurrentStage(location.stages[0]);
  setCurrentLocationFinishedStageCount(location?.totalFinishCount || []);
};
const setCurrentStage = (stage: Stage) => {
  currentStage.value = stage;
  currentStageID.value = stage.id;

  if (stage.entries) {
    currentStageLeaderBoard.value = stage.entries;
    return;
  }
  loadStageLeaderboard();
};
const setCurrentLocationFinishedStageCount = (data: TypeFinishCount[]) => {
  currentLocationFinishedStageCount.value = data;
};
const setCurrentStageLeaderboard = (entries: LeaderboardItem[]) => {
  // 保存到赛段信息
  currentStage.value.entries = entries;
};
// 统计当前分站完赛赛段数
const updateCurrentLocationFinishedStageCount = (
  leaderboard: LeaderboardItem[],
) => {
  const countMap = new Map<string, TypeFinishCount>();
  currentLocationFinishedStageCount.value.forEach((item) => {
    countMap.set(item.ssid, item);
  });

  leaderboard.forEach(({ ssid, displayName }) => {
    let old = countMap.get(ssid);
    if (!old) {
      old = {
        ssid,
        displayName,
        count: 0,
      };
    }
    old.count += 1;
    countMap.set(ssid, old);
  });

  currentLocationFinishedStageCount.value = [];
  countMap.forEach((item) => {
    currentLocationFinishedStageCount.value.push(item);
  });
  currentLocation.value.totalFinishCount =
    currentLocationFinishedStageCount.value;
};
// 统计总时间排行榜
const updateCurrentLocationTotalTimeLeaderboard = (
  leaderboard: LeaderboardItem[],
) => {
  const isFirstUpdate = currentLocationTotalTimeLeaderBoard.value.length === 0;
  const oldMap = new Map<string, TypeTotalTime>();
  const newMap = new Map<string, TypeTotalTime>();
  let minTimeNumber = 1000 * 60 * 60 * 24;
  currentLocationTotalTimeLeaderBoard.value.forEach((item) => {
    oldMap.set(item.ssid, item);
  });
  leaderboard.forEach(({ ssid, displayName, time }, index) => {
    let old = oldMap.get(ssid);
    if (!isFirstUpdate && !old) {
      return;
    }
    old ||= {
      ssid,
      displayName,
      totalTime: 0,
      differenceToFirst: 0,
      rank: 0,
    };
    old.totalTime += parseTimeToNumber(time);
    if (index === 0) {
      minTimeNumber = old.totalTime;
    }
    minTimeNumber = Math.min(minTimeNumber, old.totalTime);
    newMap.set(ssid, old);
  });

  const _leaderboard: TypeTotalTime[] = [];
  newMap.forEach((item) => {
    item.differenceToFirst = item.totalTime - minTimeNumber;
    _leaderboard[item.differenceToFirst] = item;
  });

  const _leaderboard2: TypeTotalTime[] = [];
  _leaderboard.forEach((item) => {
    _leaderboard2.push(item);
  });

  currentLocationTotalTimeLeaderBoard.value = [];
  _leaderboard2.forEach((item, index) => {
    item.rank = index + 1;
    currentLocationTotalTimeLeaderBoard.value.push(item);
  });

  currentLocation.value.totalTimeLeaderBoard =
    currentLocationTotalTimeLeaderBoard.value;
};

const dialogText = ref("");
const dialogVisible = ref(false);
const showText = (text: string) => {
  dialogText.value = text;
  dialogVisible.value = true;
};

const showSelectLocationLabel = (location: Location) => {
  const locationName = i18nUtil(
    "wrc.location",
    location.eventSettings.location,
  );
  const weatherSeason = i18nUtil(
    "app.page.clubDetail.weatherSeason",
    location.eventSettings.weatherSeason,
  );
  const vehicleClass = i18nUtil(
    "wrc.vehicleClass",
    location.eventSettings.vehicleClass,
  );
  return `${locationName} - ${weatherSeason} - ${vehicleClass}`;
};
const showSelectStageLabel = (stage: Stage) => {
  const stageName = i18nUtil("wrc.stage", stage.stageSettings.route);
  const weatherAndSurface = i18nUtil(
    "app.page.clubDetail.weatherAndSurface",
    stage.stageSettings.weatherAndSurface,
  );
  return `${stageName} - ${weatherAndSurface}`;
};

const loadingLeaderboard = ref(false);
const loadStageLeaderboard = () => {
  let selfEntry: LeaderboardItem = null;
  let _currentStageLeaderBoard: LeaderboardItem[] = [];
  const getData = async (nextCursor?: string) => {
    await stageLeaderboard({
      clubId: clubId,
      stageLeaderboardID: currentStage.value.leaderboardID,
      SortCumulative: false,
      MaxResultCount: 20,
      FocusOnMe: false,
      Platform: Platform.CROSS_PLATFORM,
      Cursor: nextCursor,
    }).then(
      async ({
        entries,
        next,
      }: {
        entries: LeaderboardItem[];
        next: string;
      }) => {
        _currentStageLeaderBoard.push(...entries);
        // 获取下一页
        if (next) {
          await getData(next);
          return;
        }

        // 避免自身记录重复
        _currentStageLeaderBoard = _currentStageLeaderBoard.filter((item) => {
          if (item.ssid !== user.value?.ssid) return true;
          selfEntry = item;
          return false;
        });
        // 设置自身记录
        if (selfEntry !== null) {
          _currentStageLeaderBoard = [
            ..._currentStageLeaderBoard.slice(0, selfEntry.rank - 1),
            selfEntry,
            ..._currentStageLeaderBoard.slice(selfEntry.rank - 1),
          ];
        }
        currentStageLeaderBoard.value = _currentStageLeaderBoard;

        if (_currentStageLeaderBoard?.length > 0) {
          setCurrentStageLeaderboard(_currentStageLeaderBoard);
          updateCurrentLocationFinishedStageCount(_currentStageLeaderBoard);
          updateCurrentLocationTotalTimeLeaderboard(_currentStageLeaderBoard);
          saveClubDetail();
        }
      },
    );
  };

  loadingLeaderboard.value = true;
  getData().finally(() => {
    loadingLeaderboard.value = false;
  });
};

const formatNumberToTime = (ms: number) => {
  return new Date(ms).toISOString().substring(11, 23);
};
const parseTimeToNumber = (time: string) => {
  let timeNumber = 0;
  const strings: string[] = time.split(":");
  let index = 0;
  timeNumber += parseInt(strings[index++]) * 60 * 60 * 1000;
  timeNumber += parseInt(strings[index++]) * 60 * 1000;
  timeNumber += Math.ceil(parseFloat(strings[index++]) * 1000);
  return timeNumber;
};

const getTableRowStyle = ({ row }: { row: TimeTrialEntry }) => {
  if (row.ssid !== user.value?.ssid) return {};
  return { "background-color": "rgba(103, 194, 58, .2)" };
};

const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>();
let scrollLeftWidth = 0;
const scrollStep = 50;
let maxScrollLeftWidth = scrollLeftWidth + scrollStep + 1;
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  if (e.deltaY > 0) {
    scrollLeftWidth = Math.min(
      maxScrollLeftWidth,
      scrollLeftWidth + scrollStep,
    );
  } else {
    scrollLeftWidth = Math.max(0, scrollLeftWidth - scrollStep);
  }
  scrollbarRef.value?.setScrollLeft(scrollLeftWidth);
};
const handleScroll = ({ scrollLeft }) => {
  maxScrollLeftWidth = scrollLeft + scrollStep + 1;
  scrollLeftWidth = scrollLeft;
};

const selectShowOptions = {
  stageLeaderboard: "stageLeaderboard",
  locationTotalTimeLeaderboard: "locationTotalTimeLeaderboard",
  locationFinishedStageCount: "locationFinishedStageCount",
};
const currentSelectShow = ref(selectShowOptions.stageLeaderboard);

const saveFinishedStageCountAsExcel = () => {
  const fileName = clubDetail.value.clubName;
  const sheetName = i18nUtil(
    "wrc.location",
    currentLocation.value.eventSettings.location,
  );
  exportToExcel(fileName, sheetName, currentLocation.value.totalFinishCount);
};

const analysis = (item: LeaderboardItem) => {
  analysisData.value.leaderboardId = item.leaderboardId;
  analysisData.value.playerId = item.wrcPlayerId;
  analysisData.value.location = showSelectLocationLabel(currentLocation.value);
  analysisData.value.stage = showSelectStageLabel(currentStage.value);
  analysisData.value.car = item.vehicle;

  visibleAnalysis.value = true;
};
const analysisData = ref({
  leaderboardId: "",
  playerId: "",
  location: "",
  stage: "",
  car: "",
});
const visibleAnalysis = ref(false);
</script>

<template>
  <div class="detail-container">
    <el-dialog v-model="dialogVisible">
      <el-text>
        {{ dialogText }}
      </el-text>
    </el-dialog>
    <Analysis
      v-model:data="analysisData"
      v-model:visible="visibleAnalysis"
    ></Analysis>
    <div class="select-page">
      <el-radio-group v-model="showLeaderboard">
        <el-radio-button :value="false">
          {{ pageI18n("select.clubDetail") }}
        </el-radio-button>
        <el-radio-button :value="true">
          {{ pageI18n("select.leaderboard") }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div
      class="page-container club-info-container"
      v-show="!showLeaderboard"
      v-loading="loadingClubDetail"
    >
      <h2 class="title">{{ pageI18n("title.clubInfo") }}</h2>
      <div class="club-info">
        <div class="info-item">
          <el-text class="label">{{
            pageI18n("clubInfo.label.clubName")
          }}</el-text>
          <el-text class="font-bold">{{ clubDetail?.clubName }}</el-text>
        </div>
        <div class="info-item">
          <el-text class="label">{{
            pageI18n("clubInfo.label.clubID")
          }}</el-text>
          <el-text>{{ clubDetail?.clubID }}</el-text>
        </div>
        <div class="info-item">
          <el-text class="label">{{
            pageI18n("clubInfo.label.ownerName")
          }}</el-text>
          <el-text>{{ clubDetail?.ownerDisplayName }}</el-text>
        </div>
        <div class="info-item">
          <el-text class="label">{{
            pageI18n("clubInfo.label.accessLevel")
          }}</el-text>
          <el-text>{{ accessLevels[clubDetail?.accessLevel] }}</el-text>
        </div>
        <div class="info-item">
          <el-text class="label">{{
            pageI18n("clubInfo.label.description")
          }}</el-text>
          <el-tooltip
            effect="light"
            :content="pageI18n('clubInfo.prompt.clickToViewDescription')"
          >
            <el-button
              link
              class="nowrap-hidden"
              @click="showText(clubDetail?.clubDescription)"
              >{{ clubDetail?.clubDescription }}</el-button
            >
          </el-tooltip>
        </div>
        <div class="info-item">
          <el-text class="label">{{
            pageI18n("clubInfo.label.count")
          }}</el-text>
          <el-text>{{ clubDetail?.activeMemberCount }}</el-text>
        </div>
        <div class="info-item">
          <el-text class="label">{{ pageI18n("clubInfo.label.like") }}</el-text>
          <el-text>{{ clubDetail?.likeCount }}</el-text>
        </div>
        <div class="info-item">
          <el-text class="label">{{
            pageI18n("clubInfo.label.dislike")
          }}</el-text>
          <el-text>{{ clubDetail?.dislikeCount }}</el-text>
        </div>
        <div class="info-item">
          <el-text class="label">{{
            pageI18n("clubInfo.label.createDate")
          }}</el-text>
          <el-text>{{
            new Date(clubDetail?.clubCreatedAt).toLocaleString()
          }}</el-text>
        </div>
      </div>
      <h2 class="title">{{ pageI18n("title.championship") }}</h2>
      <div
        class="championship-info"
        v-show="clubDetail?.championshipIDs.length > 0"
        v-loading="loadingChampionship"
      >
        <el-select
          :disabled="loadingChampionship"
          v-model="currentChampionshipID"
        >
          <el-option
            v-for="(id, index) in clubDetail?.championshipIDs"
            :value="id"
            :key="id"
            :label="`championship${index + 1}`"
            @click="loadChampionship(id)"
          >
            championship {{ index + 1 }}
          </el-option>
        </el-select>
        <div class="settings">
          <div class="setting-item">
            <el-text class="label">{{
              pageI18n("championship.label.name")
            }}</el-text>
            <el-text>{{ currentChampionship?.settings.name }}</el-text>
          </div>
          <div class="setting-item">
            <el-text class="label">{{
              pageI18n("championship.label.isHardcoreDamageEnabled")
            }}</el-text>
            <el-text>{{
              currentChampionship?.settings.isHardcoreDamageEnabled
                ? pageI18n("championship.isHardcoreDamageEnabled.true")
                : pageI18n("championship.isHardcoreDamageEnabled.false")
            }}</el-text>
          </div>
          <div class="setting-item">
            <el-text class="label">{{
              pageI18n("championship.label.isAssistsAllowed")
            }}</el-text>
            <el-text>{{
              currentChampionship?.settings.isAssistsAllowed
                ? pageI18n("championship.isAssistsAllowed.true")
                : pageI18n("championship.isAssistsAllowed.false")
            }}</el-text>
          </div>
          <div class="setting-item">
            <el-text class="label">{{
              pageI18n("championship.label.isTuningAllowed")
            }}</el-text>
            <el-text>{{
              currentChampionship?.settings.isTuningAllowed
                ? pageI18n("championship.isTuningAllowed.true")
                : pageI18n("championship.isTuningAllowed.false")
            }}</el-text>
          </div>
        </div>
      </div>
    </div>
    <div class="page-container" v-show="showLeaderboard">
      <el-select :disabled="loadingLeaderboard" v-model="currentLocationID">
        <el-option
          v-for="location in currentChampionship?.events"
          :key="location.id"
          :value="location.id"
          :label="showSelectLocationLabel(location)"
          @click="setCurrentLocation(location)"
        >
          {{ showSelectLocationLabel(location) }}
        </el-option>
      </el-select>

      <el-radio-group
        class="select-stage"
        :disabled="loadingLeaderboard"
        v-model="currentStageID"
      >
        <el-tooltip
          :content="pageI18n(`leaderboard.prompt.scrollWheelToMove`)"
          effect="light"
        >
          <el-scrollbar
            ref="scrollbarRef"
            @mousewheel="handleWheel"
            @scroll="handleScroll"
          >
            <div class="scrollbar-container">
              <el-radio-button
                v-for="(stage, index) in currentLocation?.stages"
                :value="stage.id"
                :key="stage.id"
                :label="`${index + 1} - ${showSelectStageLabel(stage)}`"
                @click="setCurrentStage(stage)"
              >
                {{
                  `${index + 1} - ${showSelectStageLabel(stage)} - ${stage.stageSettings.distance}km`
                }}
              </el-radio-button>
            </div>
          </el-scrollbar>
        </el-tooltip>
      </el-radio-group>

      <el-select v-model="currentSelectShow" :disabled="loadingLeaderboard">
        <el-option
          v-for="option in selectShowOptions"
          :label="pageI18n(`leaderboard.selectShowOptions.${option}`)"
          :key="option"
          :value="option"
          :disabled="option === currentSelectShow"
        >
          <div v-if="option !== selectShowOptions.stageLeaderboard">
            <el-tooltip
              effect="light"
              :content="pageI18n(`leaderboard.prompt.onlyLoaded`)"
            >
              <div>
                {{ pageI18n(`leaderboard.selectShowOptions.${option}`) }}
              </div>
            </el-tooltip>
          </div>
        </el-option>
      </el-select>

      <div v-show="currentSelectShow === selectShowOptions.stageLeaderboard">
        <el-table
          v-model:data="currentStageLeaderBoard"
          :height="tableHeight"
          :row-style="getTableRowStyle"
          v-loading="loadingLeaderboard"
        >
          <el-table-column
            prop="rank"
            :label="pageI18n(`leaderboard.columnName.rank`)"
            width="60"
          />
          <el-table-column
            prop="displayName"
            :label="pageI18n(`leaderboard.columnName.name`)"
          />
          <el-table-column
            prop="time"
            :label="pageI18n(`leaderboard.columnName.time`)"
          >
            <template #default="scope">
              {{ scope.row?.time?.substring(0, 12) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="differenceToFirst"
            :label="pageI18n(`leaderboard.columnName.differenceToFirst`)"
          >
            <template #default="scope">
              {{ scope.row?.differenceToFirst?.substring(0, 12) }}
            </template>
          </el-table-column>
          <el-table-column width="90" fixed="right">
            <template #default="scope">
              <el-button type="success" @click="analysis(scope.row)"
                >分析</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div
        v-show="
          currentSelectShow === selectShowOptions.locationTotalTimeLeaderboard
        "
      >
        <el-table
          v-loading="loadingLeaderboard"
          v-model:data="currentLocationTotalTimeLeaderBoard"
          :height="tableHeight"
          :row-style="getTableRowStyle"
        >
          <el-table-column
            prop="rank"
            :label="pageI18n(`leaderboard.columnName.rank`)"
            width="60"
          />
          <el-table-column
            prop="displayName"
            :label="pageI18n(`leaderboard.columnName.name`)"
          />
          <el-table-column
            prop="totalTime"
            :label="pageI18n(`leaderboard.columnName.time`)"
          >
            <template #default="scope">
              {{ formatNumberToTime(scope.row.totalTime) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="differenceToFirst"
            :label="pageI18n(`leaderboard.columnName.differenceToFirst`)"
          >
            <template #default="scope">
              {{ formatNumberToTime(scope.row.differenceToFirst) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div
        v-show="
          currentSelectShow === selectShowOptions.locationFinishedStageCount
        "
      >
        <el-tooltip effect="light">
          <template #content>
            <el-button link @click="saveFinishedStageCountAsExcel">
              {{ pageI18n("leaderboard.prompt.exportAsExcel") }}
            </el-button>
          </template>
          <el-table
            v-loading="loadingLeaderboard"
            v-model:data="currentLocationFinishedStageCount"
            :height="tableHeight"
            :row-style="getTableRowStyle"
          >
            <el-table-column
              prop="displayName"
              :label="pageI18n(`leaderboard.columnName.name`)"
            />
            <el-table-column
              prop="count"
              sortable
              :label="pageI18n(`leaderboard.columnName.finishedStageCount`)"
            />
          </el-table>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.detail-container {
  width: 100%;

  .select-page {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
  }

  .page-container {
    width: 100%;
  }

  .club-info-container {
    .title {
      font-size: 25px;
      color: var(--el-color-info);
      text-align: center;
      margin: 0;
      padding: 0;
    }
    .club-info {
      .info-item {
        border-bottom: 1px solid var(--el-border-color);
        width: 100%;
        margin: 10px 0;
        display: flex;

        .label {
          width: 90px;
          text-align: right;
          margin-right: 10px;

          &::after {
            content: ":";
          }
        }

        .nowrap-hidden {
          white-space: nowrap;
          overflow: hidden;
          max-width: calc(100vw - 250px);
        }

        .font-bold {
          font-weight: bold;
        }
      }
    }
    .championship-info {
      .settings {
        .setting-item {
          display: flex;
          .label {
            width: 90px;
            text-align: right;
            margin-right: 10px;

            &::after {
              content: ":";
            }
          }
        }
      }
    }
  }

  .select-stage {
    width: calc(100vw - 130px);

    .scrollbar-container {
      display: flex;
      margin: 10px 0;
    }
  }
}
</style>
