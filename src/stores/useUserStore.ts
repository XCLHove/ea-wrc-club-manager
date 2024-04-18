import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { profile } from "@/api/authApi.ts";
import { User } from "@/interfaces/User.ts";
import { accessTokenUtil } from "@/utils/accessTokenUtil.ts";
import { localStorageCache } from "@/utils/localStorageCache.ts";

export const useUserStore = defineStore("useUserStore", () => {
  const user = ref<User>();

  accessTokenUtil.afterSet(() => {
    localStorage.removeItem("user");
  });
  accessTokenUtil.afterRemove(() => {
    user.value = void 0;
    localStorage.removeItem("user");
  });

  const removeUserCache = (() => {
    const key = "user";
    onMounted(async () => {
      const _user = localStorageCache.get(key);
      if (_user !== null) {
        user.value = _user;
        return;
      }

      user.value = (await profile().catch(console.error)) || undefined;
      user.value && localStorageCache.set(key, user.value, 1000 * 60 * 60 * 24);
    });

    const _removeUserCache = () => {
      localStorageCache.remove(key);
    };

    return _removeUserCache;
  })();

  accessTokenUtil.afterSet(async () => {
    user.value = (await profile().catch(console.error)) || undefined;
    user.value && localStorage.setItem("user", JSON.stringify(user.value));
  });

  return {
    user,
    removeUserCache,
  };
});
