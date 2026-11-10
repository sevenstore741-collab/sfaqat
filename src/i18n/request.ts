import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const base = (await import(`../../messages/${locale}.json`)).default;
  const extra = (await import(`../../messages/${locale}.extra.json`)).default;

  return { locale, messages: { ...base, ...extra } };
});
