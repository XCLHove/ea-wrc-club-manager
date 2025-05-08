# EA WRC Club Manager

## 警告

请勿从第三方下载此软件以避免源代码被恶意修改！

## 简介

由于访问[https://racenet.com/ea_sports_wrc/clubs](https://racenet.com/ea_sports_wrc/clubs)的速度慢，但是直接调接口会快很多，此软件便诞生了。

基于[Electron-vite](https://electron-vite.github.io)构建的桌面应用。

## 下载地址

- [github(镜像站)](https://github.xclhove.top/XCLHove/ea-wrc-club-manager/releases)
- [github](https://github.com/XCLHove/ea-wrc-club-manager/releases)
- `gitee`不允许上传超过100MB的文件。

## 功能

* [X] 创建俱乐部
* [X] 搜索俱乐部
* [X] 加入俱乐部
* [X] 退出俱乐部
* [X] 解散俱乐部
* [X] 查看锦标赛赛段排名
* [X] 查看计时赛赛段排名
* [X] 统计锦标赛单个分站排名
* [X] 导出锦标赛单个分站完赛赛段数为Excel
* [X] 分析单个赛段档位使用占比(计时赛/锦标赛)
* [X] 分析单个赛段轮胎磨损情况(计时赛/锦标赛)

## 仓库地址

- GitHub: [EA WRC Club Manager](https://github.xclhove.top/XCLHove/ea-wrc-club-manager)
   ```
   https://github.xclhove.top/XCLHove/ea-wrc-club-manager
   ```
- Gitee: [EA WRC Club Manager](https://gitee.com/XCLHove/ea-wrc-club-manager)
   ```
   https://gitee.com/XCLHove/ea-wrc-club-manager
   ```

## 构建

1. clone/下载源代码
2. 安装node环境
3. 进入项目根目录(有`packge.json`的目录)
4. 安装依赖(如果安装失败可以尝试删除`packge-lock.json`后重新安装)
    ```shell
    npm install
    ```
5. 构建
   ```shell
   npm run build
   ```
6. 运行
   在`release`文件夹找到对应的程序运行即可。