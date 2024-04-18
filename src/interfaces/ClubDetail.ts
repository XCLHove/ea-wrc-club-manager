import { AccessLevel, Role } from "@/interfaces/Club.ts";
import { ChampionshipEntry } from "@/interfaces/ChampionshipStageLeaderboard.ts";
import { Platform } from "@/interfaces/Platform.ts";

export interface ClubDetail {
  clubID: string;
  officialClubType: number;
  accessCode: string;
  status: number;
  role: Role;
  reaction: number;
  creatorSSID: string;
  creatorDisplayName: string;
  ownerSSID: string;
  ownerDisplayName: string;
  ownerProfileImageUrl: string;
  clubName: string;
  clubDescription: string;
  activeMemberCount: number;
  likeCount: number;
  dislikeCount: number;
  imageCatalogueID: string;
  platform: Platform;
  accessLevel: AccessLevel;
  clubCreatedAt: string;
  socialMediaLinks: any[];
  championshipIDs: string[];
  currentChampionship: CurrentChampionship;
  extensions: Extensions;
  events: any[];
  verificationStatus: number;
}

export interface CurrentChampionship {
  id: string;
  clubID: string;
  leaderboardID: any;
  relativeTimeUntilOpen: string;
  relativeTimeUntilClose: string;
  absoluteOpenDate: string;
  absoluteCloseDate: string;
  settings: Settings;
  events: Stand[];
}

export interface Settings {
  name: string;
  format: number;
  bonusPointsMode: number;
  scoringSystem: number;
  trackDegradation: number;
  isHardcoreDamageEnabled: boolean;
  isAssistsAllowed: boolean;
  isTuningAllowed: boolean;
}

export enum StandStatus {
  ON_START = 0,
  RUNNING = 1,
  FINISHED = 2,
}

export const StandStatusMap = {
  [StandStatus.ON_START]: "未开始",
  [StandStatus.RUNNING]: "进行中",
  [StandStatus.FINISHED]: "已结束",
};

export interface Stand {
  id: string;
  leaderboardID: string;
  relativeTimeUntilOpen: string;
  relativeTimeUntilClose: string;
  absoluteOpenDate: string;
  absoluteCloseDate: string;
  status: number;
  eventSettings: EventSettings;
  stages: Stage[];
  totalTimeLeaderboard: TotalTimeEntry[];
}

export interface TotalTimeEntry {
  name: string;
  time: number;
  differenceToFirst: number;
  rank: number;
  ssid: string;
}

export interface EventSettings {
  vehicleClassID: number;
  vehicleClass: string;
  weatherSeasonID: number;
  weatherSeason: string;
  locationID: number;
  location: string;
  duration: string;
}

export interface Stage {
  id: string;
  leaderboardID: string;
  stageSettings: StageSettings;
  entries?: ChampionshipEntry[];
}

export interface StageSettings {
  routeID: number;
  route: string;
  weatherAndSurfaceID: number;
  weatherAndSurface: string;
  timeOfDayID: number;
  timeOfDay: string;
  serviceAreaID: number;
  serviceArea: string;
  distance: number;
}

export interface Extensions {}
