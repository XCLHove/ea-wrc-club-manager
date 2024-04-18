import { Platform } from "@/interfaces/Platform.ts";

export interface User {
  betaFlags: string[];
  completedOnboardings: string[];
  countryCode: string;
  displayName: string;
  isAuthenticated: boolean;
  isTermsAccepted: boolean;
  preferences: Preferences;
  pushNotificationPreferences: PushNotificationPreferences;
  ssid: string;
  userSignInPlatform: number;
  [property: string]: any;
}

export interface Preferences {
  coverPhotoUrl: string;
  eaAvatarLargeUrl: null;
  eaAvatarMediumUrl: null;
  eaAvatarSmallUrl: null;
  privacyLevelId: number;
  profileImageUrl: string;
  providers: Provider[];
  [property: string]: any;
}

export interface Provider {
  displayName?: string;
  platform?: Platform;
  platformName?: string;
  [property: string]: any;
}

export interface PushNotificationPreferences {
  f123: boolean;
  friendRequests: boolean;
  [property: string]: any;
}
