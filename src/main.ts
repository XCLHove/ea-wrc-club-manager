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
// i18n
import i18n from "@/utils/i18n.ts";

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
// i18n
app.use(i18n);
app.mount("#app");
