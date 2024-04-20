import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { MenuInfo } from "@/interfaces/MenuInfo.ts";
import { MenuItem } from "@/interfaces/MenuItem.ts";

const parsePath = (originPath: string) => {
  let path = "";
  originPath
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

export const routes = (() => {
  const pages = import.meta.glob("../views/**/*.vue", {
    eager: true,
    import: "default",
  });

  const _routers = Object.entries(pages).map(([originPath, component]) => {
    let path = originPath.replace(/\.\.\/views(.*)\.vue/, "$1");
    path = parsePath(path);

    return {
      path,
      originPath,
      // @ts-ignore
      component,
    } as RouteRecordRaw & { originPath: string };
  });

  return _routers;
})();
export const router = createRouter({
  history: createWebHashHistory(),
  routes: routes,
});
export const menuItems = (() => {
  const menus = import.meta.glob("../views/**/*.menu.ts", {
    eager: true,
    import: "default",
  });

  const routesPathMap = (() => {
    const _routesPathMap = new Map<string, boolean>();
    routes.forEach((route) => {
      _routesPathMap.set(route.path, true);
    });
    return _routesPathMap;
  })();

  const _menuItems: MenuItem[] = [];

  const tempMenuItemMap = new Map<string, MenuItem>();
  Object.entries(menus).forEach(([originPath, menuInfo], order) => {
    const menuItem: MenuItem = (() => {
      let path = originPath
        .replace("../views", "")
        .replace(/\/[0-9]+\./, "/")
        .replace(/\.menu\.ts/, "");
      path = parsePath(path);
      const { title } = menuInfo as MenuInfo;
      return {
        path,
        title,
        order,
      };
    })();

    const parentMenuItem = tempMenuItemMap.get(
      menuItem.path.replace(/\/([^\/]+)$/, ""),
    );
    if (parentMenuItem) {
      parentMenuItem.children ||= [];
      parentMenuItem.children.push(menuItem);
      return;
    }

    if (routesPathMap.has(menuItem.path)) {
      _menuItems.push(menuItem);
      return;
    }

    tempMenuItemMap.set(menuItem.path, menuItem);
  });
  tempMenuItemMap.forEach((menuItem) => {
    menuItem.children = menuItem.children?.sort((a, b) => a.order - b.order);
    _menuItems.push(menuItem);
  });

  return _menuItems.sort((a, b) => a.order - b.order);
})();
