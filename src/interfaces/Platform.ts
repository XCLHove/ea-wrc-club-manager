export enum Platform {
  /**跨平台*/
  CROSS_PLATFORM = 0,
  XBOX = 1,
  PSN = 2,
  Steam = 3,
  PC = 128,
}

export const platforms = (() => {
  const _platforms: { [prototype: number]: string } = {};
  _platforms[Platform.CROSS_PLATFORM] = "CrossPlatform";
  _platforms[Platform.XBOX] = "Xbox";
  _platforms[Platform.PSN] = "PSN";
  _platforms[Platform.PC] = "PC";
  _platforms[Platform.Steam] = "Steam";
  return _platforms;
})();
