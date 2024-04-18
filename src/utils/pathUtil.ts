export const startPath = new URL("../../public", import.meta.url).href;
export const resolvePath = (dirPath = ".") => {
  return new URL(dirPath, startPath).href.replace(/app.asar/, "public");
};
