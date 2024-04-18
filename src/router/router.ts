import { createRouter, createWebHashHistory } from "vue-router";
import { indexRoutes } from "@/router/indexRoutes.ts";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: indexRoutes,
});
