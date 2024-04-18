import ClubDetail from "@/views/club/Detail.vue";
import ClubCreate from "@/views/club/Create.vue";
import ClubSearch from "@/views/club/Search.vue";
import ClubMe from "@/views/club/Me.vue";
import ClubJoin from "@/views/club/Join.vue";

export const clubRoutes = {
  path: "/club",
  children: [
    {
      path: "detail/:clubId",
      component: ClubDetail,
    },
    {
      path: "create",
      component: ClubCreate,
    },
    {
      path: "search",
      component: ClubSearch,
    },
    {
      path: "me",
      component: ClubMe,
    },
    {
      path: "join",
      component: ClubJoin,
    },
  ],
};
