import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDaysLeft } from "@/lib/trial";
import { getSettings } from "@/lib/settings";
import AppHeader from "@/components/AppHeader";
import BotLanguageForm from "@/components/BotLanguageForm";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  const tt = await getTranslations("Training");
  const isAr = locale === "ar";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return redirect({ href: "/login", locale });

  const [{ brand, messages }, membershipRes, adminRes] = await Promise.all([
    getSettings(),
    supabase.from("merchant_members").select("merchant_id").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase.from("platform_admins").select("id").eq("id", user.id).eq("is_active", true).maybeSingle(),
  ]);
  const isAdmin = Boolean(adminRes.data);
  const brandName = isAr ? brand.name_ar : brand.name_en;

  const membership = membershipRes.data;
  if (!membership) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 text-center">
        <p className="glass p-6 text-muted">{t("noMerchant")}</p>
      </main>
    );
  }
  const merchantId = membership.merchant_id as string;

  const [merchantRes, subRes, botRes, convRes, ordersRes, recoveredRes] = await Promise.all([
    supabase.from("merchants").select("business_name_ar, business_name_en").eq("id", merchantId).maybeSingle(),
    supabase.from("subscriptions").select("status, trial_ends_at, plan_id").eq("merchant_id", merchantId).limit(1).maybeSingle(),
    supabase.from("bots").select("id, primary_lang").eq("merchant_id", merchantId).limit(1).maybeSingle(),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("merchant_id", merchantId),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("merchant_id", merchantId).eq("attributed_to_bot", true),
    supabase.from("abandoned_carts").select("id", { count: "exact", head: true }).eq("merchant_id", merchantId).eq("status", "recovered"),
  ]);

  const merchant = merchantRes.data;
  const sub = subRes.data;
  const bot = botRes.data;

  const { data: plan } = sub
    ? await supabase.from("plans").select("name_ar, name_en").eq("id", sub.plan_id).maybeSingle()
    : { data: null };

  const displayName =
    (isAr
      ? merchant?.business_name_ar ?? merchant?.business_name_en
      : merchant?.business_name_en ?? merchant?.business_name_ar) ??
    user.email ??
    "";

  const welcome = (isAr ? messages.welcome_ar : messages.welcome_en).split("{name}").join(displayName);
  const announcement = isAr ? messages.announcement_ar : messages.announcement_en;
  const trialEnding = isAr ? messages.trial_ending_ar : messages.trial_ending_en;

  const planName = plan ? (isAr ? plan.name_ar : plan.name_en) : "";
  const isTrial = sub?.status === "trialing";
  const daysLeft = isTrial ? getDaysLeft(sub?.trial_ends_at ?? null) : 0;
  const progress = Math.min(100, Math.max(0, ((7 - daysLeft) / 7) * 100));

  const stats = [
    { label: t("statConversations"), value: convRes.count ?? 0 },
    { label: t("statBotOrders"), value: ordersRes.count ?? 0 },
    { label: t("statRecovered"), value: recoveredRes.count ?? 0 },
  ];
  const steps = [
    { label: t("step1"), soon: true },
    { label: t("step2"), soon: false },
    { label: t("step3"), soon: true },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 py-6">
      <AppHeader brandName={brandName} logoUrl={brand.logo_url} active="dashboard" isAdmin={isAdmin} />

      {announcement && (
        <div className="glass mb-6 border-primary px-5 py-3 text-sm">📢 {announcement}</div>
      )}

      <h1 className="gradient-text mb-1 text-3xl font-bold">{welcome}</h1>
      <p className="mb-8 text-muted">{t("title")}</p>

      <section className="glass mb-6 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">{t("trialTitle")}</h2>
          {sub && (
            <span className="rounded-full border border-border px-3 py-0.5 text-xs text-muted">
              {t(`status.${sub.status}`)}
            </span>
          )}
        </div>
        {isTrial && (
          <>
            <p className="mb-3 text-lg">{t("trialDays", { days: daysLeft })}</p>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-black/20">
              <div className="btn-primary h-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-muted">{daysLeft <= 2 ? trialEnding : t("trialNote")}</p>
          </>
        )}
        {planName && <p className="mt-2 text-sm text-muted">{t("plan", { plan: planName })}</p>}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-semibold">{t("statsTitle")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="glass p-5">
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-1 text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold">{tt("ctaTitle")}</h2>
          <p className="text-sm text-muted">{tt("ctaHint")}</p>
        </div>
        <Link href="/dashboard/training" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-medium">
          {tt("ctaButton")}
        </Link>
      </section>

      <section className="glass mb-6 p-5">
        <h2 className="mb-3 font-semibold">{t("stepsTitle")}</h2>
        <ol className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <span>
                {i + 1}. {s.label}
              </span>
              {s.soon && <span className="text-xs text-muted">{t("soon")}</span>}
            </li>
          ))}
        </ol>
      </section>

      {bot && (
        <section className="glass p-5">
          <h2 className="mb-1 font-semibold">{t("botLangTitle")}</h2>
          <p className="mb-4 text-sm text-muted">{t("botLangHint")}</p>
          <BotLanguageForm botId={bot.id as string} initial={bot.primary_lang === "en" ? "en" : "ar"} />
        </section>
      )}
    </div>
  );
}
