<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PerformanceData, Rival } from '@/interfaces/PerformanceData'
import { performanceAnalysisApi } from '@/api/clubApi'
import * as echarts from 'echarts'
import { useWindowSize } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import simpleClone from '@/utils/simpleClone.ts'

const height = (() => {
  const { height } = useWindowSize()

  return computed(() => {
    return height.value - 130
  })
})()

const visible = defineModel('visible', {
  required: true,
  default: false,
})

type Data = {
  leaderboardId: string
  playerId: string
  displayName: string
  location: string
  stage: string
  car: string
  distance: number
}
const data = defineModel<Data>('data', {
  required: true,
  default: null,
})
const title = computed(() => {
  let result = ''
  result += data.value.location
  result += data.value.stage
  if (data.value.distance) {
    result += `(${data.value.distance}km)`
  }
  result += `-${data.value.car}`
  result = result.replace(/\s-\s/g, '-')
  return result
})
const currentHistory = ref('')
const dataHistories = ref<Data[]>([])
watch(
  () => visible.value,
  () => {
    if (!visible.value) return
    loadData()
  },
)
const close = () => {
  visible.value = false
}

const tyreWearAnalysisLineRef = ref<HTMLDivElement>()
const gearAnalysisHistogramRef = ref<HTMLDivElement>()
const brakeAndThrottleHistogramRef = ref<HTMLDivElement>()
const rivalData = ref({} as Rival)
watch(
  () => rivalData.value,
  () => {
    analysisGear()
    analysisTyreWear()
    analysisBrakeAndThrottle()
  },
)

const loading = ref(false)
const loadData = () => {
  if (!data.value) return

  if (!data.value.playerId) {
    ElMessage.warning({
      message: '该玩家未打开‘游戏偏好：公开幽灵车’选项',
      duration: 3000,
    })
    return
  }

  loading.value = true
  performanceAnalysis({
    leaderboardId: data.value.leaderboardId,
    playerId: data.value.playerId,
  })
    .then((performanceData) => {
      rivalData.value = simpleClone(performanceData.data.rival)
      currentHistory.value = getAnalysisId(data.value)
    })
    .finally(() => {
      loading.value = false
    })
}

const performanceAnalysis = (() => {
  const cacheMap = new Map<string, PerformanceData>()

  return ({ leaderboardId, playerId }: { leaderboardId: string; playerId: string }) => {
    const cacheId = `${leaderboardId}-${playerId}`
    const cacheData = cacheMap.get(cacheId)
    if (cacheData) return Promise.resolve(cacheData)

    return performanceAnalysisApi({ leaderboardId, playerId }).then((performanceData) => {
      cacheMap.set(cacheId, performanceData)
      dataHistories.value = [simpleClone(data.value), ...dataHistories.value]
      dataHistories.value = dataHistories.value.filter((_, i) => i < 6)
      return performanceData
    })
  }
})()

const analysisGear = (() => {
  let gearChartHistogram: echarts.ECharts | null = null

  return () => {
    if (!gearChartHistogram) {
      gearChartHistogram = echarts.init(gearAnalysisHistogramRef.value)
    }

    const map = new Map<number, number>()
    rivalData.value.gear.forEach((gear) => {
      const count = map.get(gear) || 0
      map.set(gear, count + 1)
    })

    const histogramData = {
      x: [] as string[],
      y: [] as number[],
    }
    map.forEach((count, gear) => {
      histogramData.x.push(`${gear}档`)
      histogramData.y.push((count / rivalData.value.gear.length) * 100)
    })
    const histogramOption: Parameters<typeof gearChartHistogram.setOption>[0] = {
      title: {
        text: '使用档位占比',
        left: 'center',
      },
      xAxis: {
        data: histogramData.x,
      },
      yAxis: {},
      series: [
        {
          type: 'bar',
          data: histogramData.y,
          label: {
            show: true,
            position: 'top',
            textStyle: {
              fontSize: 10,
            },
            formatter: (params: any) => {
              return `${params.value.toFixed(2)}%`
            },
          },
        },
      ],
    }
    gearChartHistogram.setOption(histogramOption)
  }
})()

const analysisTyreWear = (() => {
  let tyreWearChart: echarts.ECharts | null = null

  return () => {
    if (!tyreWearChart) {
      tyreWearChart = echarts.init(tyreWearAnalysisLineRef.value)
    }

    let distance = [] as number[]
    const tyreWear = [] as number[]
    rivalData.value.tyreWear.forEach((currentTyreWear, index) => {
      tyreWear.push(100 - currentTyreWear * 100)

      const currentDistance = rivalData.value.distance[index]
      distance.push(currentDistance)
    })
    const startDistance = distance[0]
    const endDistance = distance[distance.length - 1]
    const totalDistance = endDistance - startDistance
    distance = distance.map((currentDistance) => {
      const dis = currentDistance - startDistance
      if (dis === 0) return 0
      return (dis / totalDistance) * 100
    })

    const option: Parameters<typeof tyreWearChart.setOption>[0] = {
      title: {
        text: '轮胎耐久变化',
        left: 'center',
      },
      xAxis: {
        type: 'category',
        data: distance,
        axisLabel: {
          formatter: (value: string) => {
            return `${parseInt(value).toFixed(2)}%`
          },
        },
      },
      yAxis: {
        type: 'value',
        min: Math.ceil(tyreWear[0]),
        max: Math.ceil(tyreWear[tyreWear.length - 1]),
      },
      series: [
        {
          data: tyreWear,
          type: 'line',
          smooth: true,
          label: {
            show: true,
            position: 'top',
            textStyle: {
              fontSize: 10,
            },
            formatter: (params: any) => {
              return `${params.value.toFixed(2)}%`
            },
          },
        },
      ],
    }
    tyreWearChart.setOption(option)
  }
})()

const analysisBrakeAndThrottle = (() => {
  let brakeAndThrottleHistogram: echarts.ECharts | null = null

  return () => {
    if (!brakeAndThrottleHistogram) {
      brakeAndThrottleHistogram = echarts.init(brakeAndThrottleHistogramRef.value)
    }
    const dataHandlers: (({ brake, throttle, speed }: { brake: number; throttle: number; speed: number }) => void)[] = []
    const histogramDataGenerator: { name: string; valueGetter: () => number; formatter?: (value: number) => string }[] = []
    const brakes = rivalData.value.brake
    const throttles = rivalData.value.throttle
    const speeds = rivalData.value.speed

    let total = 0
    dataHandlers.push(({ brake, throttle, speed }) => {
      total += 100
    })

    let throttleTotal = 0
    dataHandlers.push(({ brake, throttle, speed }) => {
      throttleTotal += throttle
    })

    let throttleCount = 0
    dataHandlers.push(({ brake, throttle, speed }) => {
      if (throttle > 0) {
        throttleCount += 1
      }
    })

    let fullThrottleCount = 0
    dataHandlers.push(({ brake, throttle, speed }) => {
      if (throttle === 100) {
        fullThrottleCount += 1
      }
    })

    let brakeTotal = 0
    dataHandlers.push(({ brake, throttle, speed }) => {
      brakeTotal += brake
    })

    let brakeCount = 0
    dataHandlers.push(({ brake, throttle, speed }) => {
      if (brake > 0) {
        brakeCount += 1
      }
    })

    let fullBrakeCount = 0
    dataHandlers.push(({ brake, throttle, speed }) => {
      if (brake === 100) {
        fullBrakeCount += 1
      }
    })

    histogramDataGenerator.push({
      name: '油门刹车比',
      valueGetter: () => throttleTotal / brakeTotal,
      formatter: (value) => `${value.toFixed(2)} : 1`,
    })

    histogramDataGenerator.push({
      name: '油门占比',
      valueGetter: () => (throttleTotal / total) * 100,
      formatter: (value) => `${value.toFixed(2)}%`,
    })

    histogramDataGenerator.push({
      name: '油门效率',
      valueGetter: () => (throttleTotal / (throttleCount * 100)) * 100,
      formatter: (value) => `${value.toFixed(2)}%`,
    })

    histogramDataGenerator.push({
      name: '刹车占比',
      valueGetter: () => (brakeTotal / total) * 100,
      formatter: (value) => `${value.toFixed(2)}%`,
    })

    histogramDataGenerator.push({
      name: '刹车力度',
      valueGetter: () => (brakeTotal / (brakeCount * 100)) * 100,
      formatter: (value) => `${value.toFixed(2)}%`,
    })

    brakes.forEach((brake, index) => {
      const speed = speeds[index]
      if (speed === 0) return
      const throttle = throttles[index]
      dataHandlers.forEach((handler) => handler({ brake, throttle, speed }))
    })
    const formatterMap = new Map<(typeof histogramDataGenerator)[number]['name'], (typeof histogramDataGenerator)[number]['formatter']>(
      histogramDataGenerator.map((item) => [item.name, item.formatter]),
    )
    const histogramData = {
      x: histogramDataGenerator.map((item) => item.name),
      y: histogramDataGenerator.map((item) => item.valueGetter()),
    }
    const histogramOption: Parameters<typeof brakeAndThrottleHistogram.setOption>[0] = {
      title: {
        text: '油门刹车数据',
        left: 'center',
      },
      xAxis: {
        data: histogramData.x,
      },
      yAxis: {
        max: 100,
      },
      series: [
        {
          type: 'bar',
          data: histogramData.y,
          label: {
            show: true,
            position: 'top',
            textStyle: {
              fontSize: 10,
            },
            formatter: (params: { name: string; value: number }) => {
              const formatter = formatterMap.get(params.name)
              if (formatter) return formatter(params.value)
              return params.value
            },
          },
        },
      ],
    }
    brakeAndThrottleHistogram.setOption(histogramOption)
  }
})()

const getAnalysisId = (data: Data) => {
  return `${data.playerId}-${data.leaderboardId}`
}

const switchHistory = (newData: Data) => {
  data.value = newData
  setTimeout(loadData, 0)
}
</script>

<template>
  <div>
    <el-dialog fullscreen @close="close" v-model="visible" :title="title">
      <div class="flex flex-col">
        <div class="flex flex-row">
          <el-radio-group v-model="currentHistory">
            <el-radio-button v-for="item in dataHistories" :key="getAnalysisId(item)" :value="getAnalysisId(item)" @click.stop="switchHistory(item)">
              <el-tooltip :content="`${item.location}-${item.stage}-${item.car}`">
                {{ item.displayName }}
              </el-tooltip>
            </el-radio-button>
          </el-radio-group>
        </div>
        <div>
          <el-scrollbar :height="height" v-loading="loading">
            <div class="analysis-container">
              <div ref="brakeAndThrottleHistogramRef" class="brake-and-throttle-analysis"></div>
              <div ref="tyreWearAnalysisLineRef" class="tyre-wear-analysis"></div>
              <div ref="gearAnalysisHistogramRef" class="gear-analysis"></div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
.analysis-container {
  .gear-analysis {
    height: 300px;
  }

  .tyre-wear-analysis {
    height: 300px;
  }

  .brake-and-throttle-analysis {
    height: 300px;
  }
}
</style>
