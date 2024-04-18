import { defineStore } from "pinia";
import { ref } from "vue";

export const useShowLoginStore = defineStore("showLogin", () => {
  const showLogin = ref(false);
  const show = () => {
    showLogin.value = true;
  };
  const hide = () => {
    showLogin.value = false;
  };

  return {
    showLogin,
    show,
    hide,
  };
});
