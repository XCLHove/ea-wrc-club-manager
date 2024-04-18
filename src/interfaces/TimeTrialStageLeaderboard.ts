import { Platform } from "@/interfaces/Platform.ts";

export interface TimeTrialStageLeaderboard {
  /**排行榜列表*/
  entries: TimeTrialEntry[];
  isPlayerInLeaderboard: boolean;
  /**下一页的分页ID*/
  next: string;
  percentile: number;
  /**上一页的分页ID*/
  previous: null;
  /**排行榜总人数*/
  totalEntrantCount: number;
}

export interface TimeTrialEntry {
  assistFlags: number[];
  differenceToFirst: string;
  displayName: string;
  leaderboardId: null | string;
  nationalityID: number;
  platform: Platform;
  playerEntry: boolean;
  /**排名*/
  rank: number;
  splits: string[];
  ssid: string;
  time: string;
  timeAccumulated: string;
  timePenalty: string;
  usingCustomTuning: boolean;
  vehicle: string;
  vehicleClass: string;
  vehicleClassID: number;
  vehicleID: number;
  wrcPlayerId: null | string;
}
