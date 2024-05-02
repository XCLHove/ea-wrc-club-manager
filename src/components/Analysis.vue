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
    return height.value - 50;
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
}>("data", {
  required: true,
  default: null,
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

const gearAnalysisPie = ref<HTMLDivElement>();
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
    })
    .finally(() => {
      loading.value = false;
    });
};

const analysisGear = (() => {
  let gearChartPie: echarts.ECharts = null;
  let gearChartHistogram: echarts.ECharts = null;

  return () => {
    if (!gearChartPie) {
      gearChartPie = echarts.init(gearAnalysisPie.value);
    }
    if (!gearChartHistogram) {
      gearChartHistogram = echarts.init(gearAnalysisHistogram.value);
    }

    const map = new Map<number, number>();
    rivalData.gear.forEach((gear) => {
      const count = map.get(gear) || 0;
      map.set(gear, count + 1);
    });

    const pieData = [];
    const histogramData = {
      x: [],
      y: [],
    };
    map.forEach((count, gear) => {
      pieData.push({
        value: count,
        name: gear,
      });

      histogramData.x.push(`${gear}档`);
      histogramData.y.push(count / rivalData.gear.length);
    });

    const pieOption: Parameters<typeof gearChartPie.setOption>[0] = {
      title: {
        text: "档位占比",
        subtext: `${data.value.location} - ${data.value.stage} - ${data.value.car}`,
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{d}%",
      },
      series: [
        {
          name: "档位",
          type: "pie",
          radius: "50%",
          data: pieData,
          label: {
            show: true,
            formatter: "{b}档 {d}%",
          },
        },
      ],
    };
    const histogramOption: Parameters<typeof gearChartPie.setOption>[0] = {
      xAxis: {
        data: histogramData.x,
      },
      yAxis: {},
      series: [
        {
          type: "bar",
          data: histogramData.y,
        },
      ],
    };

    gearChartPie.setOption(pieOption);
    gearChartHistogram.setOption(histogramOption);
  };
})();
</script>

<template>
  <div>
    <el-dialog fullscreen @close="close" v-model="visible">
      <el-scrollbar :height="height">
        <div class="analysis-container" v-loading="loading">
          <div ref="gearAnalysisPie" class="gear-analysis"></div>
          <div ref="gearAnalysisHistogram" class="gear-analysis"></div>
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
}
</style>
