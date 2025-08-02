<script setup lang="ts">
import { getStatsValues, timeTrialLeaderBoard } from '@/api/timeTrialLeaderBoardApi'
import { OrderedLocation, OrderedVehicleClass, StatsValues, SurfaceConditions, Vehicles } from '@/interfaces/StatsValues.ts'
import { computed, onMounted, Ref, ref, watch } from 'vue'
import { TimeTrialEntry, TimeTrialStageLeaderboard } from '@/interfaces/TimeTrialStageLeaderboard.ts'
import { useWindowSize } from '@vueuse/core'
import { Platform, platforms } from '@/interfaces/Platform.ts'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/useUserStore.ts'
import { User } from '@/interfaces/User.ts'
import { i18nUtil } from '@/utils/i18n.ts'
import { elPrompt } from '@/utils/elPrompt'
import Analysis from '@/components/Analysis.vue'

const pageI18n = (name: string) => {
  return i18nUtil('app.page.timeTrail', name)
}

const tableHeight = (() => {
  const { height } = useWindowSize()
  return computed(() => height.value - 210)
})()
const loading = ref(false)

const { user }: { user: Ref<User> } = storeToRefs(useUserStore())
const getTableRowStyle = ({ row }: { row: TimeTrialEntry }) => {
  if (row.ssid !== user.value?.ssid) return {}
  return { 'background-color': 'rgba(103, 194, 58, .2)' }
}

const statsValues = ref<StatsValues>()
onMounted(async () => {
  statsValues.value = await getStatsValues()
  setCurrentLocation(statsValues.value?.orderedLocations[0])
  setCurrentVehicleClass(statsValues.value?.orderedVehicleClasses[0])
  setSurfaceConditions(statsValues.value?.surfaceConditions)
  getLeaderboard()
})

const currentLocationID = ref('')
type TypeStage = { id: string; value: string }
const currentLocationStages = ref<TypeStage[]>([])
const setCurrentLocation = (location: OrderedLocation) => {
  currentLocation = location
  currentLocationID.value = location.id

  currentLocationStages.value = []
  statsValues.value!.locationRoute[location.id].forEach((i) => {
    currentLocationStages.value.push({
      id: i,
      value: statsValues.value!.routes[i],
    })
  })
  setCurrentStage(currentLocationStages.value[0])
}

let currentStage: TypeStage
let currentLocation: OrderedLocation
let currentVehicleClass: OrderedVehicleClass
let currentSurfaceCondition: TypeSurfaceCondition
const setCurrentStage = (stage: TypeStage) => {
  currentStage = stage
  params.value.stageID = stage.id
}
const setCurrentVehicleClass = (vehicleClass: OrderedVehicleClass) => {
  currentVehicleClass = vehicleClass
  params.value.vehicleClassID = vehicleClass.id
}
const setCurrentSurfaceCondition = (surfaceCondition: TypeSurfaceCondition) => {
  currentSurfaceCondition = surfaceCondition
  params.value.surfaceConditionID = surfaceCondition.id
}

const leaderboard = ref<TimeTrialStageLeaderboard>({
  totalEntrantCount: 0,
} as TimeTrialStageLeaderboard)
const params = ref<Parameters<typeof timeTrialLeaderBoard>[0]>({
  stageID: '',
  surfaceConditionID: '',
  vehicleClassID: '',
  platform: Platform.CROSS_PLATFORM.toString() as any,
  cursor: undefined,
  focusOnMe: false,
  maxResultCount: 20,
})
watch(params.value, () => {
  getLeaderboard()
})
const getLeaderboard = () => {
  loading.value = true

  timeTrialLeaderBoard(params.value)
    .then((data) => {
      leaderboard.value = data

      loading.value = false
    })
    .catch(({ message }) => {
      elPrompt.error(message)
    })
    .finally(() => {
      loading.value = false
    })
}

type TypeSurfaceCondition = { id: string; value: string }
const surfaceConditions = ref<TypeSurfaceCondition[]>([])
const setSurfaceConditions = (_surfaceConditions: SurfaceConditions) => {
  for (const id in _surfaceConditions) {
    surfaceConditions.value.push({
      id: id,
      value: _surfaceConditions[id],
    })
  }
  setCurrentSurfaceCondition(surfaceConditions.value[0])
}

const page = ref({
  current: 1,
  total: 0,
})
watch(
  () => page.value.current,
  (newValue, oldValue) => {
    const number = newValue - oldValue
    if (number === 0) return

    if (newValue - oldValue > 0) {
      params.value.cursor = leaderboard.value?.next
      getLeaderboard()
      return
    }

    params.value.cursor = leaderboard.value?.previous
    getLeaderboard()
  },
)

const analysis = (item: TimeTrialEntry) => {
  let location = i18nUtil('wrc.location', currentLocation.value)
  location += ' - '
  location += i18nUtil('wrc.vehicleClass', currentVehicleClass.value)

  let stage = i18nUtil('wrc.stage', currentStage.value)
  stage += ' - '
  stage += i18nUtil('wrc.surfaceCondition', currentSurfaceCondition.value)

  analysisData.value = {
    leaderboardId: item.leaderboardId as string,
    playerId: item.wrcPlayerId as string,
    displayName: item.displayName,
    location: location,
    stage: stage,
    car: item.vehicle,
    distance: 0,
  }
  visibleAnalysis.value = true
}
const analysisData = ref({
  leaderboardId: '',
  playerId: '',
  displayName: '',
  location: '',
  stage: '',
  car: '',
  distance: 0,
})
const visibleAnalysis = ref(false)
</script>

<template>
  <div class="time-trial-container">
    <Analysis v-model:data="analysisData" v-model:visible="visibleAnalysis"></Analysis>
    <div class="options">
      <el-select v-model="currentLocationID" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center">{{ pageI18n('selectHeader.selectLocation') }}</el-text>
        </template>
        <el-option
          v-for="location in statsValues?.orderedLocations"
          :label="i18nUtil('wrc.location', location.value)"
          :value="location.id"
          @click="setCurrentLocation(location)"
        />
      </el-select>
      <el-select v-model="params.stageID" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center">{{ pageI18n('selectHeader.selectStage') }}</el-text>
        </template>
        <el-option
          v-for="stage in currentLocationStages"
          :label="i18nUtil('wrc.stage', stage.value)"
          :value="stage.id"
          @click="setCurrentStage(stage)"
        />
      </el-select>
    </div>
    <div class="options">
      <el-select v-model="params.vehicleClassID" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center">{{ pageI18n('selectHeader.selectVehicleClass') }}</el-text>
        </template>
        <el-option
          v-for="vehicleClass in statsValues?.orderedVehicleClasses"
          :label="i18nUtil('wrc.vehicleClass', vehicleClass.value)"
          :value="vehicleClass.id"
        />
      </el-select>
      <el-select v-model="params.surfaceConditionID" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center">{{ pageI18n('selectHeader.selectSurfaceCondition') }}</el-text>
        </template>
        <el-option
          v-for="surfaceCondition in surfaceConditions"
          :value="surfaceCondition.id"
          :label="i18nUtil('wrc.surfaceCondition', surfaceCondition.value)"
          @click="setCurrentSurfaceCondition(surfaceCondition)"
        />
      </el-select>
      <el-select v-model="params.platform" :disabled="loading">
        <template #header>
          <el-text style="display: flex; justify-content: center">{{ pageI18n('selectHeader.selectPlatform') }}</el-text>
        </template>
        <div v-for="(platform, key) in platforms">
          <el-option v-if="Platform.Steam !== key" :label="pageI18n(`platform.${platform}`)" :value="key" :key="key"> </el-option>
        </div>
      </el-select>
    </div>
    <div class="show-leaderboard" v-loading="loading">
      <el-table :data="leaderboard?.entries" :height="tableHeight" :row-style="getTableRowStyle">
        <el-table-column prop="rank" :label="pageI18n('columnName.rank')" width="75"></el-table-column>
        <el-table-column prop="displayName" :label="pageI18n('columnName.name')"></el-table-column>
        <el-table-column prop="time" :label="pageI18n('columnName.time')">
          <template #default="scope">
            {{ scope.row.time.substring(0, 12) }}
          </template>
        </el-table-column>
        <el-table-column prop="differenceToFirst" :label="pageI18n('columnName.differenceToFirst')">
          <template #default="scope">
            {{ scope.row.time.substring(0, 12) }}
          </template>
        </el-table-column>
        <el-table-column width="90" fixed="right">
          <template #default="scope">
            <el-button type="success" @click="analysis(scope.row)">{{ pageI18n('rowOperation.analysis') }}</el-button>
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
