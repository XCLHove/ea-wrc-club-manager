export interface StatsValues {
  /**分站ID与赛段ID映射对象*/
  locationRoute: LocationRoute;
  /**分站ID与名称映射对象*/
  locations: Locations;
  /**排序好的分站列表*/
  orderedLocations: OrderedLocation[];
  /**排序好的车辆组别列表*/
  orderedVehicleClasses: OrderedVehicleClass[];
  /**赛段ID与名称映射对象*/
  routes: Routes;
  /**路面情况ID与名称映射对象*/
  surfaceConditions: SurfaceConditions;
  /**车辆组别ID与名称映射对象*/
  vehicleClasses: VehicleClasses;
  /**车辆ID与名称映射对象*/
  vehicles: Vehicles;
}

/**分站ID与赛段ID映射对象*/
export interface LocationRoute {
  [property: string]: string[];
}

/**分站ID与名称映射对象*/
export interface Locations {
  [property: string]: string;
}

export interface OrderedLocation {
  id: string;
  value: string;
}

export interface OrderedVehicleClass {
  id: string;
  value: string;
}

/**赛段ID与名称映射对象*/
export interface Routes {
  [property: string]: string;
}

/**路面情况ID与名称映射对象*/
export interface SurfaceConditions {
  [property: string]: string;
}

/**车辆组别ID与名称映射对象*/
export interface VehicleClasses {
  [property: string]: string;
}

/**车辆ID与名称映射对象*/
export interface Vehicles {
  [property: string]: string;
}
