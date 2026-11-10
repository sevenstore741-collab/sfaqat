"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Locale");
  const pathname = usePathname();
  const router = useRouter();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <button
        type="button"
        onClick={() => router.replace(pathname, { locale: next })}
        className="h-9 rounded-lg border border-border bg-card px-3 text-sm transition hover:border-primary"
      >
        {t("switchTo")}
      </button>
    </div>
  );
}
