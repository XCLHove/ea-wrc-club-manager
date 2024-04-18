import { clubRoutes } from "@/router/clubRoutes.ts";

export const indexRoutes = [
  {
    path: "/",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: "/detail",
    component: () => import("@/views/Detail.vue"),
  },
  {
    path: "/time-trial",
    component: () => import("@/views/TimeTrial.vue"),
  },
  clubRoutes,
];
