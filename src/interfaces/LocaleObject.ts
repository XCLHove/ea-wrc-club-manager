export interface LocaleObject {
  languageLocaleName: string;
  wrc: {
    // 分站
    location: {
      [property: string]: string;
    };
    // 赛段
    stage: {
      [property: string]: string;
    };
    // 路面情况
    surfaceCondition: {
      [property: string]: string;
    };
    // 车辆组别
    vehicleClass: {
      [property: string]: string;
    };
  };
}
