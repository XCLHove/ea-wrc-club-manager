export enum Platform {
  /**跨平台*/
  CROSS_PLATFORM = 0,
  XBOX = 1,
  PSN = 2,
  Steam = 3,
  PC = 128,
}
export const platforms = [
  { value: Platform.CROSS_PLATFORM, description: "跨平台" },
  { value: Platform.XBOX, description: "Xbox" },
  { value: Platform.PSN, description: "PSN" },
  { value: Platform.PC, description: "PC" },
  { value: Platform.Steam, description: "Steam" },
];

export const showPlatform = (() => {
  const platformMap = new Map<Platform, string>();
  platforms.forEach(({ value: platform, description }) => {
    platformMap.set(platform, description);
  });

  return (platform: Platform) => {
    return platformMap.get(platform) || "未知";
  };
})();
