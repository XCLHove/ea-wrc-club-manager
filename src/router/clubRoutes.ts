export const clubRoutes = {
  path: "/club",
  children: [
    {
      path: "detail/:clubId",
      component: () => import("@/views/club/Detail.vue"),
    },
    {
      path: "create",
      component: () => import("@/views/club/Create.vue"),
    },
    {
      path: "search",
      component: () => import("@/views/club/Search.vue"),
    },
    {
      path: "me",
      component: () => import("@/views/club/Me.vue"),
    },
    {
      path: "join",
      component: () => import("@/views/club/Join.vue"),
    },
  ],
};
