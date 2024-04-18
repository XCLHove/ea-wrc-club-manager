export interface ChampionshipStageLeaderboard {
  next?: string;
  previous?: string;
  totalEntrantCount: number;
  isPlayerInLeaderboard: boolean;
  percentile: number;
  entries: ChampionshipEntry[];
}

export interface ChampionshipEntry {
  ssid: string;
  displayName: string;
  rank: number;
  leaderboardId: any;
  wrcPlayerId: any;
  time: string;
  differenceToFirst: string;
  nationalityID: number;
  assists: any[];
  timeAccumulated: string;
  timePenalty: string;
  vehicle: string;
  points: number;
  platform: number;
  playerEntry: boolean;
}
