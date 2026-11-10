import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getPlans, getSettings } from "@/lib/settings";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tp = await getTranslations("Pricing");
  const [{ brand }, plans] = await Promise.all([getSettings(), getPlans()]);

  const isAr = locale === "ar";
  const name = isAr ? brand.name_ar : brand.name_en;
  const tagline = isAr ? brand.tagline_ar : brand.tagline_en;
  const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-6">
      <header className="glass flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt={name} className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <span className="btn-primary grid h-9 w-9 place-items-center rounded-xl font-bold">
              {name.slice(0, 1)}
            </span>
          )}
          <div className="leading-tight">
            <p className="font-bold">{name}</p>
            <p className="text-xs text-muted">{tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-muted transition hover:text-foreground">
            {t("login")}
          </Link>
          <LocaleSwitcher />
        </div>
      </header>

      <section className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="glass rounded-full px-4 py-1 text-sm text-muted">{t("badge")}</span>
        <h1 className="gradient-text max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">{t("title")}</h1>
        <p className="max-w-xl text-lg text-muted">{t("subtitle")}</p>
        <Link href="/signup" className="btn-primary rounded-2xl px-8 py-3.5 text-lg font-medium">
          {t("cta")}
        </Link>
      </section>

      <section className="pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">{tp("title")}</h2>
          <p className="mt-2 text-muted">{tp("subtitle")}</p>
        </div>
        {plans.length === 0 ? (
          <p className="text-center text-muted">{tp("empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`glass flex flex-col gap-4 p-6 ${p.code === "growth" ? "ring-2 ring-primary" : ""}`}
              >
                <h3 className="text-xl font-bold">{isAr ? p.name_ar : p.name_en}</h3>
                <p>
                  <span className="text-4xl font-bold">{money.format(p.price_monthly)}</span>{" "}
                  <span className="text-muted">
                    {p.currency} {tp("perMonth")}
                  </span>
                </p>
                <p className="text-sm text-muted">
                  {tp("orYearly", { price: money.format(p.price_yearly), currency: p.currency })}
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  {typeof p.limits.conversations === "number" && (
                    <li>✓ {tp("conversations", { count: p.limits.conversations })}</li>
                  )}
                  {typeof p.limits.stores === "number" && <li>✓ {tp("stores", { count: p.limits.stores })}</li>}
                  {p.features.whatsapp && <li>✓ {tp("whatsapp")}</li>}
                  {p.features.cart_recovery && <li>✓ {tp("cartRecovery")}</li>}
                </ul>
                <Link href="/signup" className="btn-primary mt-auto rounded-xl px-4 py-2.5 text-center font-medium">
                  {tp("cta")}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
