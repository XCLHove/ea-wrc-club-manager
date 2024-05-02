export interface PerformanceData {
  data: Data;
  renderSettings: null;
}

export interface Data {
  player: null;
  rival: Rival;
}

export interface Rival {
  brake: number[];
  distance: number[];
  gear: number[];
  gearChar: null;
  handBrake: number[];
  lateral: null;
  longitudinal: null;
  maxBrake: number;
  maxDistance: number;
  maxGear: number;
  maxLateral: number;
  maxLongitudinal: number;
  maxMillis: number;
  maxProgress: number;
  maxRPM: number;
  maxSpeed: number;
  maxSteering: number;
  maxThrottle: number;
  maxXPosition: number;
  maxYPosition: number;
  maxZPosition: number;
  millis: number[];
  minBrake: number;
  minDistance: number;
  minGear: number;
  minLateral: number;
  minLongitudinal: number;
  minMillis: number;
  minProgress: number;
  minRPM: number;
  minSpeed: number;
  minSteering: number;
  minThrottle: number;
  minXPosition: number;
  minYPosition: number;
  minZPosition: number;
  performanceAnalysisMetadata: PerformanceAnalysisMetadata;
  position: Position[];
  progress: null;
  rearWing: null;
  rotation: Rotation[];
  rpm: null;
  speed: number[];
  steering: number[];
  throttle: number[];
}

export interface PerformanceAnalysisMetadata {
  lapTime: string;
  mapId: string;
  platform: number;
  playerName: string;
  referenceMass: number;
  sectorIndex: number[];
  sectorMillis: number[];
  sectorTimes: string[];
  teamId: number;
  teamName: null;
  vehicleClassId: number;
  vehicleId: number;
  vehicleName: string;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  w: number;
  x: number;
  y: number;
  z: number;
}
