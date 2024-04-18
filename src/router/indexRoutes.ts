import { clubRoutes } from "@/router/clubRoutes.ts";
import Detail from "@/views/Detail.vue";
import TimeTrial from "@/views/TimeTrial.vue";

export const indexRoutes = [
  {
    path: "/",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: "/detail",
    component: Detail,
  },
  {
    path: "/time-trial",
    component: TimeTrial,
  },
  clubRoutes,
];
