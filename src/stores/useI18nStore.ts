import { defineStore } from "pinia";
import { onBeforeMount, ref } from "vue";
import i18n, { i18nMessages, locales } from "@/utils/i18n.ts";
import { LocaleObject } from "@/interfaces/LocaleObject.ts";
import axios from "axios";
import { resolvePath } from "@/utils/pathUtil.ts";

export const useI18nStore = defineStore("useI18nStore", () => {
  const _currentLocale = ref(`${i18n.global.locale.value}`);

  const _locales = ref<{ name: string; value: string }[]>(locales);
  const _messages = (() => {
    const __messages = new Map<string, LocaleObject>();
    Object.entries(i18nMessages).forEach(
      ([locale, message]: [string, LocaleObject]) => {
        __messages.set(locale, message);
      },
    );
    return __messages;
  })();
  const _addLocale = (locale: string, message: LocaleObject) => {
    if (!_messages.has(locale)) {
      _locales.value.push({
        value: locale,
        name: message.languageLocaleName || locale,
      });
    }

    _messages.set(locale, message);
    i18n.global.setLocaleMessage(locale, message);
  };
  const _setLocale = (locale: string) => {
    _currentLocale.value = locale;
    i18n.global.locale.value = locale;
  };

  onBeforeMount(() => {
    axios.get(resolvePath("locales/locales.json")).then(({ data }) => {
      data ||= [];
      data.forEach((item: string) => {
        axios
          .get(resolvePath(`locales/${item}.json`))
          .then(({ data }: { data: LocaleObject }) => {
            if (!data.languageLocaleName) return;
            _addLocale(item, data);
          })
          .catch(() => {});
      });
    });
  });

  return {
    currentLocale: _currentLocale,
    locales: _locales,
    setLocale: _setLocale,
  };
});
