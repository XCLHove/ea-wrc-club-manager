import request from "../utils/request.ts";
import { AccessLevel, Club } from "../interfaces/Club.ts";
import { Order, SortBy } from "@/interfaces/Search.ts";
import { ClubDetail, Championship } from "@/interfaces/ClubDetail.ts";
import { ChampionshipStageLeaderboard } from "@/interfaces/ChampionshipStageLeaderboard.ts";
import { Platform } from "@/interfaces/Platform.ts";
import { PerformanceData } from "@/interfaces/PerformanceData.ts";

export const pageMyClubs = ({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) => {
  return request
    .get("/wrc2023clubs/memberships/active", {
      params: {
        take: pageSize,
        skip: pageSize * (page - 1),
        includeChampionship: true,
      },
    })
    .then((res) => {
      const {
        activeMemberships: clubs,
        totalActiveMemberships: total,
      }: {
        activeMemberships: Club[];
        totalActiveMemberships: string;
      } = res.data;

      return {
        clubs: clubs,
        total: parseInt(total),
      };
    });
};

export const searchClub = ({
  page,
  pageSize,
  search,
  sort,
  order,
}: {
  page: number;
  pageSize: number;
  search: string;
  sort: SortBy;
  order: Order;
}) => {
  return request
    .get("/wrc2023clubs/search", {
      params: {
        take: pageSize,
        skip: pageSize * (page - 1),
        clubName: search,
        sortBy: sort,
        sortOrder: order,
      },
    })
    .then((res) => {
      const {
        results: clubs,
        totalResults: total,
      }: {
        results: Club[];
        totalResults: string;
      } = res.data;

      return {
        clubs: clubs,
        total: parseInt(total),
      };
    });
};

export const createClub = (data: {
  name: string;
  description: string;
  imageCatalogueID: number;
  accessLevel: AccessLevel;
  platform: Platform;
  officialClubType: number;
  discordServerUrl: string;
  twitchChannelUrl: string;
  youtubeChannelUrl: string;
}) => {
  return request
    .post("/wrc2023clubs", data)
    .then(({ data }: { data: Club }) => {
      return data;
    });
};
export const createClubValidate = (
  name: "name" | "description",
  value: string,
) => {
  return request.post(`/wrc2023clubs/validation/${name}`, value);
};

export const closeClub = (clubId: string) => {
  return request.post(`/wrc2023clubs/${clubId}/close`).then((res) => {
    return true;
  });
};

export const leaveClub = (clubId: string) => {
  return request.post(`/wrc2023clubs/${clubId}/leave`).then((res) => {
    return true;
  });
};

export const joinClub = (clubId: string) => {
  return request.post(`/wrc2023clubs/${clubId}/application`).then((res) => {
    return true;
  });
};
export const clubDetail = (clubId: string) => {
  return request
    .get(`/wrc2023clubs/${clubId}`, {
      params: { includeChampionship: true },
    })
    .then(({ data }: { data: ClubDetail }) => {
      return data;
    });
};

export const stageLeaderboard = ({
  clubId,
  stageLeaderboardID,
  SortCumulative,
  MaxResultCount,
  FocusOnMe,
  Platform,
  Cursor,
}: {
  clubId: string;
  stageLeaderboardID: string;
  SortCumulative: boolean;
  MaxResultCount: number;
  FocusOnMe: boolean;
  Platform: Platform;
  Cursor?: string;
}) => {
  return request
    .get(`/wrc2023clubs/${clubId}/leaderboard/${stageLeaderboardID}`, {
      params: {
        SortCumulative,
        MaxResultCount,
        FocusOnMe,
        Platform,
        Cursor,
      },
    })
    .then(({ data }: { data: ChampionshipStageLeaderboard }) => {
      return data;
    });
};

export const getChampionship = (championshipID: string) => {
  return request
    .get(`/wrc2023clubs/championships/${championshipID}`)
    .then(({ data }: { data: Championship }) => {
      return data;
    });
};

export const performanceAnalysis = (() => {
  const cache = new Map<string, PerformanceData>();

  return ({
    leaderboardId,
    playerId,
  }: {
    leaderboardId: string;
    playerId: string;
  }) => {
    const cacheId = `${leaderboardId}-${playerId}`;
    if (cache.has(cacheId)) {
      return Promise.resolve(cache.get(cacheId));
    }

    return request
      .get("/wrc2023Stats/performanceAnalysis/ghost", {
        params: {
          WrcRivalLeaderboardId: leaderboardId,
          WrcRivalPlayerId: playerId,
        },
      })
      .then(({ data }) => {
        cache.set(cacheId, data);
        return data;
      }) as Promise<PerformanceData>;
  };
})();
