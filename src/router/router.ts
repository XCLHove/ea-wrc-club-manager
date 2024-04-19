import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = (() => {
  const parsePath = (pathLine: string) => {
    let path = "";
    pathLine
      .split("/")
      .slice(1)
      .forEach((pathWord) => {
        const match = pathWord.match(/^\[(.*)]$/);
        if (match) {
          path += `/:${match[1]}`;
          return;
        }

        if (
          pathWord.toLowerCase() === "home" ||
          pathWord.toLowerCase() === "index"
        ) {
          return;
        }

        let wordStartIndex = 0;
        const length = pathWord.length;

        let word = "";
        for (let i = 1; i < length; i++) {
          const nextWillEnd = i + 1 === length;
          const notCapitalized = pathWord[i] === pathWord[i].toLowerCase();

          if (!nextWillEnd && notCapitalized) continue;

          if (nextWillEnd) i = length;
          word += pathWord.slice(wordStartIndex, i).toLowerCase();
          if (!nextWillEnd) word += "-";

          wordStartIndex = i;
        }
        if (word.length > 0) path += `/${word}`;
      });
    return path || "/";
  };

  const pages = import.meta.glob("../views/**/*.vue", {
    eager: true,
    import: "default",
  });

  return Object.entries(pages).map(([pathLine, component]) => {
    pathLine = pathLine.replace(/\.\.\/views(.*)\.vue/, "$1");
    const path = parsePath(pathLine);

    return {
      path,
      // @ts-ignore
      component,
    } as RouteRecordRaw;
  });
})();
export const router = createRouter({
  history: createWebHashHistory(),
  routes: routes,
});
