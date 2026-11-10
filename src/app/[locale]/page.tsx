import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          {t("login")}
        </Link>
        <LocaleSwitcher />
      </div>
      <span className="rounded-full border border-border bg-card px-4 py-1 text-sm text-muted">
        {t("badge")}
      </span>
      <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{t("title")}</h1>
      <p className="max-w-xl text-lg text-muted">{t("subtitle")}</p>
      <Link
        href="/signup"
        className="rounded-xl bg-primary px-6 py-3 font-medium text-white"
      >
        {t("cta")}
      </Link>
    </main>
  );
}
