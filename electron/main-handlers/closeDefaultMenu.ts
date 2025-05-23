import { Menu } from "electron";

const closeDefaultMenu = () => {
  // 关闭默认菜单
  Menu.setApplicationMenu(null);
};

export default closeDefaultMenu;
