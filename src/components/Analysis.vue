<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { PerformanceData, Rival } from "@/interfaces/PerformanceData";
import { performanceAnalysis } from "@/api/clubApi";
import * as echarts from "echarts";
import { debounce } from "@/utils/debounce/debounce";
import { useWindowSize } from "@vueuse/core";
import { elPrompt } from "@/utils/elPrompt";

const height = (() => {
  const { height } = useWindowSize();

  return computed(() => {
    return height.value - 100;
  });
})();

const visible = defineModel("visible", {
  required: true,
  default: false,
});
const data = defineModel<{
  leaderboardId: string;
  playerId: string;
  location: string;
  stage: string;
  car: string;
  distance: number;
}>("data", {
  required: true,
  default: null,
});
const title = computed(() => {
  let result = "";
  result += data.value.location;
  result += data.value.stage;
  if (data.value.distance) {
    result += `(${data.value.distance}km)`;
  }
  result += `-${data.value.car}`;
  result = result.replace(/\s-\s/g, "-");
  return result;
});
watch(
  data.value,
  debounce(() => {
    visible.value = true;
    loadData();
  }, 0.2),
);
const close = () => {
  visible.value = false;
};

const tyreWearAnalysisLine = ref<HTMLDivElement>();
const gearAnalysisHistogram = ref<HTMLDivElement>();
let rivalData = {} as Rival;

const loading = ref(false);
const loadData = () => {
  if (!data.value) return;

  if (!data.value.playerId) {
    elPrompt.warning("该玩家未打开‘游戏偏好：公开幽灵车’选项", 3);
    return;
  }

  loading.value = true;
  performanceAnalysis({
    leaderboardId: data.value.leaderboardId,
    playerId: data.value.playerId,
  })
    .then((data: PerformanceData) => {
      rivalData = data.data.rival;
      analysisGear();
      analysisTyreWear();
    })
    .finally(() => {
      loading.value = false;
    });
};

const analysisGear = (() => {
  let gearChartHistogram: echarts.ECharts = null;

  return () => {
    if (!gearChartHistogram) {
      gearChartHistogram = echarts.init(gearAnalysisHistogram.value);
    }

    const map = new Map<number, number>();
    rivalData.gear.forEach((gear) => {
      const count = map.get(gear) || 0;
      map.set(gear, count + 1);
    });

    const histogramData = {
      x: [],
      y: [],
    };
    map.forEach((count, gear) => {
      histogramData.x.push(`${gear}档`);
      histogramData.y.push((count / rivalData.gear.length) * 100);
    });
    const histogramOption: Parameters<typeof gearChartHistogram.setOption>[0] =
      {
        xAxis: {
          data: histogramData.x,
        },
        yAxis: {},
        series: [
          {
            type: "bar",
            data: histogramData.y,
            label: {
              show: true,
              position: "top",
              textStyle: {
                fontSize: 10,
              },
              formatter: (params) => {
                return `${params.value.toFixed(2)}%`;
              },
            },
          },
        ],
      };
    gearChartHistogram.setOption(histogramOption);
  };
})();

const analysisTyreWear = (() => {
  let tyreWearChart: echarts.ECharts = null;

  return () => {
    if (!tyreWearChart) {
      tyreWearChart = echarts.init(tyreWearAnalysisLine.value);
    }

    let distance = [];
    const tyreWear = [];
    rivalData.tyreWear.forEach((currentTyreWear, index) => {
      tyreWear.push(100 - currentTyreWear * 100);

      const currentDistance = rivalData.distance[index];
      distance.push(currentDistance);
    });
    const startDistance = distance[0];
    const endDistance = distance[distance.length - 1];
    const totalDistance = endDistance - startDistance;
    distance = distance.map((currentDistance) => {
      const dis = currentDistance - startDistance;
      if (dis === 0) return 0;
      return (dis / totalDistance) * 100;
    });

    const option: Parameters<typeof tyreWearChart.setOption>[0] = {
      xAxis: {
        type: "category",
        data: distance,
        axisLabel: {
          formatter: (value) => {
            return `${(+value).toFixed(2)}%`;
          },
        },
      },
      yAxis: {
        type: "value",
        min: Math.ceil(tyreWear[0]),
        max: Math.ceil(tyreWear[tyreWear.length - 1]),
      },
      series: [
        {
          data: tyreWear,
          type: "line",
          smooth: true,
          label: {
            show: true,
            position: "top",
            textStyle: {
              fontSize: 10,
            },
            formatter: (params) => {
              return `${params.value.toFixed(2)}%`;
            },
          },
        },
      ],
    };
    tyreWearChart.setOption(option);
  };
})();
</script>

<template>
  <div>
    <el-dialog fullscreen @close="close" v-model="visible" :title="title">
      <el-scrollbar :height="height">
        <div class="analysis-container" v-loading="loading">
          <div ref="gearAnalysisHistogram" class="gear-analysis"></div>
          <div ref="tyreWearAnalysisLine" class="tyre-wear-analysis"></div>
        </div>
      </el-scrollbar>
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
}
</style>
