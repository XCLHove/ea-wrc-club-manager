// locales/i18n.ts
import { createI18n } from "vue-i18n";

const _i18nMessages: { [key: string]: any } = {};
const _exportLocaleList: { value: string; name: string }[] = [];

const importLanguages = import.meta.glob("../locales/*.ts", {
  eager: true,
  import: "default",
});
Object.entries(importLanguages).map(([locale, localeObject]) => {
  locale = locale
    .replace(/\.\.\/locales\/([a-zA-Z_-]+)\.ts/, "$1")
    .replace("_", "-")
    .toLowerCase();

  _i18nMessages[locale] = localeObject;
  _exportLocaleList.push({
    value: locale,
    // @ts-ignore
    name: localeObject.languageLocaleName || locale,
  });
});

const i18n = createI18n({
  locale: navigator.language.toLowerCase(),
  messages: _i18nMessages,
  legacy: false,
  //globalInjection: true,
});

export const i18nMessages = _i18nMessages;

export const i18nUtil = (prefix: string, key: number | string) => {
  // @ts-ignore
  return i18n.global.t(`${prefix}.${key}`).replace(`${prefix}.`, "");
};

export const locales = [..._exportLocaleList];

export const setLocale = (locale: string) => {
  i18n.global.locale.value = locale;
};

export default i18n;
