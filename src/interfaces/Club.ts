import { Platform } from "@/interfaces/Platform.ts";

export interface Setting {
  bonusPointsMode: number;
  scoringSystem: number;
  trackDegradation: number;
  isHardcoreDamageEnabled: boolean;
  isAssistsAllowed: boolean;
  isTuningAllowed: boolean;
}

export interface CurrentChampionshipSummary {
  clubID: string;
  championshipID: string;
  isActiveNow: boolean;
  absoluteStartDate: string;
  absoluteEndDate: string;
  timeUntilStart: string;
  timeUntilEnd: string;
  eventLocation: number;
  settings: Setting;
}

export enum AccessLevel {
  OPEN = "0",
  FRIENDS_ONLY = "3",
}

export const accessLevels = (() => {
  const _accessLevels: { [prototype: string]: string } = {};
  _accessLevels[AccessLevel.OPEN] = "Open";
  _accessLevels[AccessLevel.FRIENDS_ONLY] = "FriendsOnly";

  return _accessLevels;
})();

export enum Role {
  NO_JOIN = 0,
  OWNER = 1,
  MEMBER = 3,
}
export const roles = [
  { value: Role.NO_JOIN, description: "未加入" },
  { value: Role.OWNER, description: "管理员" },
  { value: Role.MEMBER, description: "成员" },
];

export interface Club {
  role: Role;
  clubID: string;
  officialClubType: number;
  clubName: string;
  ownerSSID: string;
  ownerDisplayName: string;
  platform: Platform;
  accessLevel: AccessLevel;
  activeMemberCount: number;
  likeCount: number;
  dislikeCount: number;
  imageCatalogueID: string;
  activeSince: string;
  currentChampionshipSummary: CurrentChampionshipSummary;
  events: any[];
}
