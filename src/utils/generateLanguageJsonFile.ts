import { getStatsValues } from "@/api/timeTrialLeaderBoardApi.ts";
import saveObjectToJsonFile from "@/utils/saveObjectToJsonFile.ts";
import { LocaleObject } from "@/interfaces/LocaleObject.ts";
import { MenuInfo } from "@/interfaces/MenuInfo.ts";

const generateLanguageJsonFile = (() => {
  const object: LocaleObject = {
    languageLocaleName: "en-us",
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
    app: {
      menu: {},
      page: {},
      components: {},
    },
  };

  getStatsValues().then((data) => {
    // 分站
    data.orderedLocations.forEach((location) => {
      object.wrc.location[location.value] = location.value;
    });

    // 赛段
    for (const key in data.routes) {
      const stageName = data.routes[key].replace("'", " ");
      object.wrc.stage[stageName] = stageName;
    }

    // 路面情况
    for (const key in data.surfaceConditions) {
      object.wrc.surfaceCondition[data.surfaceConditions[key]] =
        data.surfaceConditions[key];
    }

    // 车辆组别
    data.orderedVehicleClasses.forEach((vehicleClass) => {
      object.wrc.vehicleClass[vehicleClass.value] = vehicleClass.value;
    });
  });

  // 页面
  const i18nPageFiles = import.meta.glob("../views/**/*.i18n.ts", {
    eager: true,
    import: "default",
  });
  Object.entries(i18nPageFiles).forEach(([originPath, i18nObject]) => {
    let pageName = "";
    originPath
      .replace("../views/", "")
      .replace(".i18n.ts", "")
      .split("/")
      .forEach((value, index) => {
        if (index === 0) {
          pageName = value.substring(0, 1).toLowerCase() + value.substring(1);
          return;
        }
        pageName += value.substring(0, 1).toUpperCase() + value.substring(1);
      });
    object.app.page[pageName] = i18nObject;
  });

  // 菜单
  const i18nMenuFiles = import.meta.glob("../views/**/*.menu.ts", {
    eager: true,
    import: "default",
  });
  Object.entries(i18nMenuFiles).forEach(([_, i18nObject]) => {
    const { title } = i18nObject as MenuInfo;
    object.app.menu[title] = title;
  });

  // 组件
  const i18nComponentFiles = import.meta.glob("../components/**/*.i18n.ts", {
    eager: true,
    import: "default",
  });
  Object.entries(i18nComponentFiles).forEach(([originPath, i18nObject]) => {
    const originName = originPath
      .replace("../components/", "")
      .replace(".i18n.ts", "");
    const componentName =
      originName.substring(0, 1).toLowerCase() + originName.substring(1);
    object.app.components[componentName] = i18nObject;
  });

  return (fileName = "en-us.json") => {
    saveObjectToJsonFile(object, fileName);
  };
})();

export default generateLanguageJsonFile;
