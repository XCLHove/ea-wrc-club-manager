import { createApp } from "vue";
import App from "./App.vue";

// css
import "@/assets/css/base.css";

// Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// @ts-ignore
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { router } from "@/router/router.ts";
import { createPinia } from "pinia";

const app = createApp(App);
// Element-Plus
app.use(ElementPlus, {
  locale: zhCn,
});
// vue-router
app.use(router);
// pinia
const pinia = createPinia();
app.use(pinia);
app.mount("#app");
