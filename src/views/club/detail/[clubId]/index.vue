<script setup lang="ts">
import { clubDetail as getClubDetail, getChampionship, joinClub, stageLeaderboardApi } from '@/api/clubApi'
import { useRoute } from 'vue-router'
import { computed, customRef, onMounted, Ref, ref } from 'vue'
import { Championship, ClubDetail, Location, LocationStatus, Stage } from '@/interfaces/ClubDetail'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/useUserStore.ts'
import { User } from '@/interfaces/User.ts'
import { useWindowSize } from '@vueuse/core'
import { accessLevels, Role } from '@/interfaces/Club'
import { dayjs, ElMessage, ElMessageBox, ElScrollbar, ScrollbarInstance } from 'element-plus'
import { i18nUtil } from '@/utils/i18n'
import { Platform } from '@/interfaces/Platform'
import { LeaderboardItem } from '@/interfaces/ChampionshipStageLeaderboard'
import { elPrompt } from '@/utils/elPrompt'
import { exportToExcel, exportToExcelV2, Row } from '@/utils/exportToExcel'
import Analysis from '@/components/Analysis.vue'

const pageI18n = (name: string) => {
  return i18nUtil('app.page.clubDetail', name)
}
const { height: windowHeight } = useWindowSize()
const tableHeight = computed(() => windowHeight.value - 285)

const searchDisplayName = ref('')

// 俱乐部ID
const { clubId } = useRoute().params as { clubId: string }
// 用户信息
const { user }: { user: Ref<User> } = storeToRefs(useUserStore())
// 俱乐部信息
const clubDetail = ref<ClubDetail>()
const clubChampionshipIDs = computed(() => clubDetail.value?.championshipIDs || [])
// 当前锦标赛
const currentChampionship = ref<Championship>()
const currentChampionshipID = ref('')
const currentChampionshipLocations = computed(() => currentChampionship.value?.events || [])
// 当前分站
type NewLocation = Location & {
  allLeaderboardList?: AllLeaderboardItem[]
}
const currentLocation = ref<NewLocation>()
const currentLocationStages = computed(() => currentLocation.value?.stages || [])
// 当前赛段
const currentStage = ref<Stage>()
const currentStageID = ref('')
// 当前赛段排行榜
const currentStageLeaderBoard = ref<LeaderboardItem[]>([])
const currentStageFilteredLeaderBoard = computed(() => {
  return currentStageLeaderBoard.value.filter((item) => {
    if (!searchDisplayName.value) return true
    if (!item.displayName.toUpperCase().includes(searchDisplayName.value.toLocaleUpperCase())) return false
    return true
  })
})
// 全部排行榜
type AllLeaderboardItem = {
  ssid: string
  displayName: string
  totalTime: number
  differenceToFirst: number
  finishedStageCount: number
  rank: number
  stageLeaderboard: (LeaderboardItem | null | undefined)[]
}
const allLeaderboardList = customRef(() => {
  return {
    get() {
      return currentLocation.value?.allLeaderboardList || []
    },
    set(value: AllLeaderboardItem[]) {
      currentLocation.value!.allLeaderboardList = value
    },
  }
})
// 获取俱乐部信息
const loadingClubDetail = ref(false)
onMounted(() => {
  loadingClubDetail.value = true
  getClubDetail(clubId)
    .then((club: ClubDetail) => {
      setClubDetail(club)
    })
    .catch(() => {
      ElMessage.error('获取俱乐部信息失败！')
    })
    .finally(() => {
      loadingClubDetail.value = false
    })
})
const setClubDetail = (value: ClubDetail) => {
  clubDetail.value = value
  setCurrentChampionship(value.currentChampionship)
}
const saveClubDetail = () => {
  // 保存到分站信息
  currentLocation.value!.stages.forEach((stage, index) => {
    if (stage.id !== currentStage.value?.id) return
    currentLocation.value!.stages[index] = currentStage.value
  })
  // 保存到赛事信息
  currentChampionship.value!.events.forEach((location, index) => {
    if (location.id !== currentLocation.value?.id) return
    currentChampionship.value!.events[index] = currentLocation.value
  })
  // 保存到俱乐部信息
  clubDetail.value!.championships ||= {}
  clubDetail.value!.championships[currentChampionship.value!.id] = <Championship>currentChampionship.value
}
const loadingChampionship = ref(false)
const loadChampionship = (id: string) => {
  let championship = clubDetail.value!.championships?.[id]
  if (championship) {
    setCurrentChampionship(championship)
    return
  }

  loadingChampionship.value = true
  getChampionship(id)
    .then((championship) => {
      setCurrentChampionship(championship)
    })
    .catch(({ message }) => {
      elPrompt.error(message)
    })
    .finally(() => {
      loadingChampionship.value = false
    })
}
const setCurrentChampionship = (championship: Championship) => {
  if (!championship) return
  if (!clubDetail.value) return

  clubDetail.value.championships ||= {}
  clubDetail.value.championships[championship.id] = championship
  currentChampionship.value = championship
  currentChampionshipID.value = championship.id

  let location = championship.events?.[0]
  championship.events?.forEach((item) => {
    if (item.status !== LocationStatus.RUNNING) return
    location = item
  })
  setCurrentLocation(location)
}
const setCurrentLocation = (location: NewLocation) => {
  currentLocation.value = location
  setCurrentStage(location.stages[0])
}
const setCurrentStage = (stage: Stage) => {
  if (loadingLeaderboard.value) return
  currentStage.value = stage
  currentStageID.value = stage.id
  currentStageLeaderBoard.value = stage.entries || []
  if (currentStageLeaderBoard.value.length === 0) {
    loadStageLeaderboard()
  }
}
const setCurrentStageLeaderboard = (entries: LeaderboardItem[]) => {
  // 保存到赛段信息
  currentStage.value!.entries = entries
}

// 计算赛段时间(当没有数据时)
const getStageTimeOnNoData = (stage: Stage) => {
  // 25km以上为35分钟
  if (stage.stageSettings.distance > 25) {
    return 35 * 60 * 1000
  }

  // 16-25km为25分钟
  if (stage.stageSettings.distance > 16) {
    return 25 * 60 * 1000
  }

  // 8-16km为16分钟
  if (stage.stageSettings.distance > 8) {
    return 16 * 60 * 1000
  }

  // 8km以下为8分钟
  return 8 * 60 * 1000
}
// 统计全部排行榜
const updateAllLeaderboardList = (leaderboard: LeaderboardItem[]) => {
  const currentStageIndex = currentLocationStages.value.findIndex((stage) => stage.id === currentStageID.value)
  const oldMap = new Map<string, AllLeaderboardItem>(allLeaderboardList.value.map((item) => [item.ssid, item]))
  const newMap = new Map<string, AllLeaderboardItem>()
  leaderboard.forEach((leaderboardItem) => {
    const getDefault = () => {
      const totalTime = Array.from({ length: currentStageIndex })
        .map((_, index) => {
          const stage = currentLocationStages.value[index]
          return getStageTimeOnNoData(stage)
        })
        .reduce((acc, cur) => acc + cur, 0)
      const stageLeaderboard = [
        ...Array.from({ length: currentStageIndex }).map(() => void 0),
        ...Array.from({ length: currentLocationStages.value.length - currentStageIndex }).map(() => null),
      ]
      const result: AllLeaderboardItem = {
        ssid: leaderboardItem.ssid,
        displayName: leaderboardItem.displayName,
        totalTime: totalTime,
        finishedStageCount: 0,
        differenceToFirst: 0,
        rank: 0,
        stageLeaderboard: stageLeaderboard,
      }
      return result
    }
    const allLeaderboardItem = oldMap.get(leaderboardItem.ssid) || getDefault()
    allLeaderboardItem.totalTime += parseTimeToNumber(leaderboardItem.time)
    allLeaderboardItem.finishedStageCount += 1
    allLeaderboardItem.stageLeaderboard[currentStageIndex] = leaderboardItem
    oldMap.delete(allLeaderboardItem.ssid)
    newMap.set(allLeaderboardItem.ssid, allLeaderboardItem)
  })
  oldMap.forEach((item) => {
    item.stageLeaderboard[currentStageIndex] = void 0
    item.totalTime += getStageTimeOnNoData(currentLocationStages.value[currentStageIndex])
    newMap.set(item.ssid, item)
  })

  let newAllLeaderboardList = [...newMap.values()]

  // 计算差时
  let minTotalTime = -1
  newAllLeaderboardList.forEach((item) => {
    if (minTotalTime === -1) {
      minTotalTime = item.totalTime
    }
    minTotalTime = Math.min(minTotalTime, item.totalTime)
  })
  newAllLeaderboardList.forEach((item) => {
    item.differenceToFirst = item.totalTime - minTotalTime
  })

  // 计算排名
  newAllLeaderboardList = newAllLeaderboardList.sort((a, b) => {
    let r = a.totalTime - b.totalTime
    return r
  })
  newAllLeaderboardList.forEach((item, index) => {
    item.rank = index + 1
  })

  allLeaderboardList.value = newAllLeaderboardList
}

const showClubDescriptionDialog = (text: string) => {
  ElMessageBox({
    title: 'Club Description',
    message: text,
    showConfirmButton: false,
  })
}

const getLocationSelectLabel = (location: Location) => {
  const locationName = i18nUtil('wrc.location', location.eventSettings.location)
  const weatherSeason = i18nUtil('app.page.clubDetail.weatherSeason', location.eventSettings.weatherSeason)
  const vehicleClass = i18nUtil('wrc.vehicleClass', location.eventSettings.vehicleClass)
  return `${locationName} - ${weatherSeason} - ${vehicleClass}`
}
const getStageSelectLabel = (stage: Stage) => {
  const stageName = i18nUtil('wrc.stage', stage.stageSettings.route)
  const weatherAndSurface = i18nUtil('app.page.clubDetail.weatherAndSurface', stage.stageSettings.weatherAndSurface)
  return `${stageName} - ${weatherAndSurface}`
}

const loadingLeaderboard = ref(false)
const loadStageLeaderboard = async () => {
  const getStageLeaderBoardData = async (nextCursor?: string) => {
    const { entries, next } = await stageLeaderboardApi({
      clubId: clubId,
      stageLeaderboardID: currentStage.value!.leaderboardID,
      SortCumulative: false,
      MaxResultCount: 20,
      FocusOnMe: false,
      Platform: Platform.CROSS_PLATFORM,
      Cursor: nextCursor,
    })
    // 获取下一页
    if (next) {
      const nextEntries: LeaderboardItem[] = await getStageLeaderBoardData(next)
      return [...entries, ...nextEntries]
    }

    return entries
  }

  loadingLeaderboard.value = true
  let newStageLeaderBoard = await getStageLeaderBoardData().finally(() => {
    loadingLeaderboard.value = false
  })
  // 避免记录重复
  const entryMap = new Map<string, LeaderboardItem>()
  newStageLeaderBoard = newStageLeaderBoard.filter((item) => {
    if (entryMap.has(item.ssid)) return false
    entryMap.set(item.ssid, item)
    return true
  })
  currentStageLeaderBoard.value = newStageLeaderBoard

  if (newStageLeaderBoard.length > 0) {
    setCurrentStageLeaderboard(newStageLeaderBoard)
    updateAllLeaderboardList(newStageLeaderBoard)
    saveClubDetail()
  }
}

const formatNumberToTime = (ms: number) => {
  return new Date(ms).toISOString().substring(11, 23)
}
const parseTimeToNumber = (time: string) => {
  let timeNumber = 0
  const strings: string[] = time.split(':')
  let index = 0
  timeNumber += parseInt(strings[index++]) * 60 * 60 * 1000
  timeNumber += parseInt(strings[index++]) * 60 * 1000
  timeNumber += Math.ceil(parseFloat(strings[index++]) * 1000)
  return timeNumber
}

const getTableRowStyle = (ssid: string) => {
  if (ssid !== user.value?.ssid) return {}
  return { 'background-color': 'rgba(103, 194, 58, .2)' }
}

const scrollbarRef = ref<ScrollbarInstance>()
let scrollLeftWidth = 0
const scrollStep = 50
let maxScrollLeftWidth = scrollLeftWidth + scrollStep + 1
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  if (e.deltaY > 0) {
    scrollLeftWidth = Math.min(maxScrollLeftWidth, scrollLeftWidth + scrollStep)
  } else {
    scrollLeftWidth = Math.max(0, scrollLeftWidth - scrollStep)
  }
  scrollbarRef.value?.setScrollLeft(scrollLeftWidth)
}
const handleScroll = ({ scrollLeft }: { scrollLeft: number }) => {
  maxScrollLeftWidth = scrollLeft + scrollStep + 1
  scrollLeftWidth = scrollLeft
}

const analysis = (item: LeaderboardItem) => {
  analysisData.value.leaderboardId = item.leaderboardId
  analysisData.value.playerId = item.wrcPlayerId
  analysisData.value.location = getLocationSelectLabel(currentLocation.value!)
  analysisData.value.stage = getStageSelectLabel(currentStage.value!)
  analysisData.value.car = item.vehicle
  analysisData.value.distance = currentStage.value!.stageSettings.distance

  visibleAnalysis.value = true
}
const analysisData = ref({
  leaderboardId: '',
  playerId: '',
  location: '',
  stage: '',
  car: '',
  distance: 0,
})
const visibleAnalysis = ref(false)

const join = (clubId: string) => {
  loadingClubDetail.value = true
  joinClub(clubId)
    .then(() => {
      ElMessage.success('加入成功！')
      window.location.reload()
    })
    .catch(() => {
      ElMessage.error('加入失败！')
    })
}

const saveAllLeaderboardAsExcel = () => {
  const data: Row[] = []
  allLeaderboardList.value.forEach((allLeaderboardItem) => {
    const row: Row = []
    row.push({
      name: 'ssid',
      value: allLeaderboardItem.ssid,
    })
    row.push({
      name: 'EA ID',
      value: allLeaderboardItem.displayName,
    })
    row.push({
      name: '排名',
      value: allLeaderboardItem.rank,
    })
    row.push({
      name: '有效场次',
      value: allLeaderboardItem.finishedStageCount,
    })
    row.push({
      name: '总时间',
      value: formatNumberToTime(allLeaderboardItem.totalTime),
    })
    row.push({
      name: '差时',
      value: formatNumberToTime(allLeaderboardItem.differenceToFirst),
    })
    allLeaderboardItem.stageLeaderboard.forEach((stageLeaderboardItem, index) => {
      if (stageLeaderboardItem === null) return
      let value = stageLeaderboardItem?.time.substring(0, 12)
      value ||= formatNumberToTime(getStageTimeOnNoData(currentLocationStages.value[index]))
      row.push({
        name: `SS${index + 1}`,
        value: value,
      })
    })
    data.push(row)
  })

  const fileName = clubDetail.value!.clubName
  const sheetName = i18nUtil('wrc.location', currentLocation.value!.eventSettings.location)
  exportToExcelV2(`${fileName}(${sheetName})`, sheetName, data)
}
</script>

<template>
  <div class="detail-container">
    <Analysis v-model:data="analysisData" v-model:visible="visibleAnalysis"></Analysis>
    <el-tabs model-value="clubDetail">
      <!--club detail-->
      <el-tab-pane name="clubDetail" :label="pageI18n('select.clubDetail')">
        <div class="page-container club-info-container" v-loading="loadingClubDetail">
          <h2 class="title">{{ pageI18n('title.clubInfo') }}</h2>
          <div class="club-info">
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.clubName') }}</el-text>
              <el-text class="font-bold">{{ clubDetail?.clubName }}</el-text>
              <el-button v-if="clubDetail?.role === Role.NO_JOIN" style="margin-left: 10px" type="primary" link @click="join(clubId)">加入</el-button>
            </div>
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.clubID') }}</el-text>
              <el-text>{{ clubDetail?.clubID }}</el-text>
            </div>
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.ownerName') }}</el-text>
              <el-text>{{ clubDetail?.ownerDisplayName }}</el-text>
            </div>
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.accessLevel') }}</el-text>
              <el-text>{{ accessLevels[clubDetail?.accessLevel || ''] }}</el-text>
            </div>
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.description') }}</el-text>
              <el-tooltip effect="light" :content="pageI18n('clubInfo.prompt.clickToViewDescription')">
                <el-button link class="nowrap-hidden" @click="showClubDescriptionDialog(clubDetail?.clubDescription || '')">{{
                  clubDetail?.clubDescription
                }}</el-button>
              </el-tooltip>
            </div>
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.count') }}</el-text>
              <el-text>{{ clubDetail?.activeMemberCount }}</el-text>
            </div>
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.like') }}</el-text>
              <el-text>{{ clubDetail?.likeCount }}</el-text>
            </div>
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.dislike') }}</el-text>
              <el-text>{{ clubDetail?.dislikeCount }}</el-text>
            </div>
            <div class="info-item">
              <el-text class="label">{{ pageI18n('clubInfo.label.createDate') }}</el-text>
              <el-text>{{ dayjs(clubDetail?.clubCreatedAt).format('YYYY-MM-DD HH:mm:ss') }}</el-text>
            </div>
          </div>
          <h2 class="title">{{ pageI18n('title.championship') }}</h2>
          <div class="championship-info" v-show="clubChampionshipIDs.length > 0" v-loading="loadingChampionship">
            <el-select :disabled="loadingChampionship" v-model="currentChampionshipID">
              <el-option
                v-for="(id, index) in clubChampionshipIDs"
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
                <el-text class="label">{{ pageI18n('championship.label.name') }}</el-text>
                <el-text>{{ currentChampionship?.settings.name }}</el-text>
              </div>
              <div class="setting-item">
                <el-text class="label">{{ pageI18n('championship.label.isHardcoreDamageEnabled') }}</el-text>
                <el-text>{{
                  currentChampionship?.settings.isHardcoreDamageEnabled
                    ? pageI18n('championship.isHardcoreDamageEnabled.true')
                    : pageI18n('championship.isHardcoreDamageEnabled.false')
                }}</el-text>
              </div>
              <div class="setting-item">
                <el-text class="label">{{ pageI18n('championship.label.isAssistsAllowed') }}</el-text>
                <el-text>{{
                  currentChampionship?.settings.isAssistsAllowed
                    ? pageI18n('championship.isAssistsAllowed.true')
                    : pageI18n('championship.isAssistsAllowed.false')
                }}</el-text>
              </div>
              <div class="setting-item">
                <el-text class="label">{{ pageI18n('championship.label.isTuningAllowed') }}</el-text>
                <el-text>{{
                  currentChampionship?.settings.isTuningAllowed
                    ? pageI18n('championship.isTuningAllowed.true')
                    : pageI18n('championship.isTuningAllowed.false')
                }}</el-text>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!--leaderboard-->
      <el-tab-pane name="leaderboard" :label="pageI18n('select.leaderboard')">
        <div class="page-container">
          <!--select location-->
          <el-select :disabled="loadingLeaderboard" v-model="currentLocation" value-key="id">
            <el-option
              v-for="location in currentChampionshipLocations"
              :key="location.id"
              :value="location"
              :label="getLocationSelectLabel(location)"
              @click="setCurrentLocation(location)"
            >
              {{ getLocationSelectLabel(location) }}
            </el-option>
          </el-select>

          <!--select stage-->
          <el-radio-group class="select-stage" :disabled="loadingLeaderboard" v-model="currentStageID">
            <el-tooltip :content="pageI18n(`leaderboard.prompt.scrollWheelToMove`)" effect="light">
              <el-scrollbar ref="scrollbarRef" @mousewheel="handleWheel" @scroll="handleScroll">
                <div class="scrollbar-container">
                  <el-radio-button
                    v-for="(stage, index) in currentLocationStages"
                    :value="stage.id"
                    :key="stage.id"
                    :label="`${index + 1} - ${getStageSelectLabel(stage)}`"
                    @click="setCurrentStage(stage)"
                  >
                    <el-text v-show="stage.entries && currentStage?.id !== stage.id" type="success">
                      {{ `${index + 1} - ${getStageSelectLabel(stage)} - ${stage.stageSettings.distance}km` }}
                    </el-text>
                    <div v-show="!(stage.entries && currentStage?.id !== stage.id)">
                      {{ `${index + 1} - ${getStageSelectLabel(stage)} - ${stage.stageSettings.distance}km` }}
                    </div>
                  </el-radio-button>
                </div>
              </el-scrollbar>
            </el-tooltip>
          </el-radio-group>

          <el-tabs model-value="stageLeaderboard">
            <!--stageLeaderboard-->
            <el-tab-pane name="stageLeaderboard" :label="pageI18n('leaderboard.selectShowOptions.stageLeaderboard')">
              <el-table
                :data="currentStageFilteredLeaderBoard"
                :height="tableHeight"
                :row-style="(d: any) => getTableRowStyle((d.row as LeaderboardItem).ssid)"
                v-loading="loadingLeaderboard"
              >
                <el-table-column prop="rank" :label="pageI18n(`leaderboard.columnName.rank`)" width="60" fixed="left" />
                <el-table-column prop="displayName" :label="pageI18n(`leaderboard.columnName.name`)">
                  <template #header>
                    <div style="display: flex; flex-direction: row; align-items: center">
                      <span style="white-space: nowrap; margin-right: 5px">{{ pageI18n(`leaderboard.columnName.name`) }}</span>
                      <el-input size="small" v-model="searchDisplayName" placeholder="search"></el-input>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="time" :label="pageI18n(`leaderboard.columnName.time`)">
                  <template #default="scope">
                    {{ scope.row?.time?.substring(0, 12) }}
                  </template>
                </el-table-column>
                <el-table-column prop="differenceToFirst" :label="pageI18n(`leaderboard.columnName.differenceToFirst`)">
                  <template #default="scope: { row: LeaderboardItem }">
                    {{ scope.row.differenceToFirst.substring(0, 12) }}
                  </template>
                </el-table-column>
                <el-table-column width="90" fixed="right">
                  <template #default="scope">
                    <el-button type="success" @click="analysis(scope.row)">{{ pageI18n(`leaderboard.rowOperation.analysis`) }}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!--all leaderboard-->
            <el-tab-pane name="allLeaderboard" :label="'全部排行榜'">
              <div style="width: calc(100vw - 155px)">
                <el-tooltip placement="top" effect="light">
                  <template #content>
                    <el-text type="danger" @click="saveAllLeaderboardAsExcel">点击导出为Excel</el-text>
                  </template>

                  <el-table
                    :data="allLeaderboardList"
                    :height="tableHeight"
                    :row-style="(d: any) => getTableRowStyle((d.row as AllLeaderboardItem).ssid)"
                    v-loading="loadingLeaderboard"
                  >
                    <el-table-column
                      prop="displayName"
                      :label="pageI18n(`leaderboard.columnName.name`)"
                      fixed="left"
                      width="150"
                      show-overflow-tooltip
                    >
                      <!--<template #header>-->
                      <!--  <div style="display: flex; flex-direction: row; align-items: center">-->
                      <!--    <span style="white-space: nowrap; margin-right: 5px">{{ pageI18n(`leaderboard.columnName.name`) }}</span>-->
                      <!--    <el-input size="small" v-model="searchDisplayName" placeholder="search"></el-input>-->
                      <!--  </div>-->
                      <!--</template>-->
                    </el-table-column>
                    <el-table-column prop="rank" :label="pageI18n(`leaderboard.columnName.rank`)" width="60" align="center" />
                    <el-table-column prop="finishedStageCount" :label="'有效赛段'" width="60" align="center" />
                    <el-table-column prop="totalTime" :label="pageI18n(`leaderboard.columnName.time`)" width="120" align="center">
                      <template #default="{ row }: { row: AllLeaderboardItem }">
                        {{ formatNumberToTime(row.totalTime) }}
                      </template>
                    </el-table-column>
                    <el-table-column
                      prop="differenceToFirst"
                      :label="pageI18n(`leaderboard.columnName.differenceToFirst`)"
                      width="120"
                      align="center"
                    >
                      <template #default="{ row }: { row: AllLeaderboardItem }">
                        {{ formatNumberToTime(row.differenceToFirst) }}
                      </template>
                    </el-table-column>
                    <el-table-column v-for="i in currentLocationStages.length" :key="i" :label="`s${i}`" width="110" align="center">
                      <template #default="{ row }: { row: AllLeaderboardItem }">
                        <div v-if="row.stageLeaderboard[i - 1]">{{ formatNumberToTime(parseTimeToNumber(row.stageLeaderboard[i - 1]!.time)) }}</div>
                        <div v-else-if="row.stageLeaderboard[i - 1] === null"></div>
                        <el-text v-else type="danger">{{ formatNumberToTime(getStageTimeOnNoData(currentLocationStages[i - 1])) }}</el-text>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tooltip>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>
    </el-tabs>
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
            content: ':';
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
              content: ':';
            }
          }
        }
      }
    }
  }

  .select-stage {
    width: calc(100vw - 155px);

    .scrollbar-container {
      display: flex;
      margin: 10px 0;
    }
  }
}
</style>
