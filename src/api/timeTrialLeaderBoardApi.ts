import request from "@/utils/request.ts";
import { TimeTrialStageLeaderboard } from "@/interfaces/TimeTrialStageLeaderboard.ts";
import { StatsValues } from "@/interfaces/StatsValues.ts";
import { Platform } from "@/interfaces/Platform.ts";
import { localStorageCache } from "@/utils/localStorageCache.ts";

export const getStatsValues = () => {
  return new Promise<StatsValues>((resolve, reject) => {
    const key = "statsValues";
    const oldData = localStorageCache.get(key) as StatsValues;
    if (oldData !== null) {
      resolve(oldData);
      return;
    }

    request
      .get("/wrc2023Stats/values")
      .then(({ data }: { data: StatsValues }) => {
        localStorageCache.set(key, data, 1000 * 60 * 60 * 24);
        resolve(data);
      });
  });
};

export const timeTrialLeaderBoard = ({
  stageID,
  vehicleClassID,
  surfaceConditionID,
  maxResultCount = 20,
  focusOnMe = false,
  cursor,
  platform = Platform.CROSS_PLATFORM,
}: {
  stageID: string;
  vehicleClassID: string;
  surfaceConditionID: string;
  maxResultCount?: number;
  focusOnMe?: boolean;
  cursor?: string;
  platform?: Platform;
}) => {
  return request
    .get(
      `/wrc2023Stats/leaderboard/${stageID}/${vehicleClassID}/${surfaceConditionID}`,
      {
        params: {
          maxResultCount: maxResultCount,
          focusOnMe: focusOnMe,
          cursor: cursor,
          platform: platform,
        },
      },
    )
    .then(({ data }: { data: TimeTrialStageLeaderboard }) => {
      return data;
    });
};
