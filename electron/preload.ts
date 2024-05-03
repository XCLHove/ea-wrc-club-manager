const apis = import.meta.glob(["./preloadApis/*.ts", "!./preloadApis/*.d.ts"], {
  eager: true,
  import: "default",
});
Object.entries(apis).forEach(([_, handler]) => {
  (handler as Function)();
});
