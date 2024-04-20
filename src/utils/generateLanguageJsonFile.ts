import { getStatsValues } from "@/api/timeTrialLeaderBoardApi.ts";
import saveObjectToJsonFile from "@/utils/saveObjectToJsonFile.ts";
import { LocaleObject } from "@/interfaces/LocaleObject.ts";

export default async function generateLanguageJsonFile(
  fileName = "language.json",
) {
  const object: LocaleObject = {
    languageLocaleName: "languageLocaleName",
    wrc: {
      // 分站
      location: {},
      // 赛段
      stage: {},
      // 路面情况
      surfaceCondition: {},
      // 车辆组别
      vehicleClass: {},
    },
  };

  const data = await getStatsValues();

  // 分站
  data.orderedLocations.forEach((location) => {
    object.wrc.location[location.value] = "";
  });

  // 赛段
  for (const key in data.routes) {
    object.wrc.stage[data.routes[key]] = "";
  }

  // 路面情况
  for (const key in data.surfaceConditions) {
    object.wrc.surfaceCondition[data.surfaceConditions[key]] = "";
  }

  // 车辆组别
  data.orderedVehicleClasses.forEach((vehicleClass) => {
    object.wrc.vehicleClass[vehicleClass.value] = "";
  });

  saveObjectToJsonFile(object, fileName);
}
