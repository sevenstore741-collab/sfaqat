import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import AppHeader from "@/components/AppHeader";
import TrainingManager, { type TrainingItem } from "@/components/TrainingManager";

export default async function TrainingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Training");
  const td = await getTranslations("Dashboard");
  const isAr = locale === "ar";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return redirect({ href: "/login", locale });

  const [{ brand }, membershipRes, adminRes] = await Promise.all([
    getSettings(),
    supabase.from("merchant_members").select("merchant_id").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase.from("platform_admins").select("id").eq("id", user.id).eq("is_active", true).maybeSingle(),
  ]);
  const brandName = isAr ? brand.name_ar : brand.name_en;

  if (!membershipRes.data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 text-center">
        <p className="glass p-6 text-muted">{td("noMerchant")}</p>
      </main>
    );
  }
  const merchantId = membershipRes.data.merchant_id as string;

  const { data: rows } = await supabase
    .from("bot_training_items")
    .select("id, kind, title, keywords, content, lang, is_active, created_at")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 py-6">
      <AppHeader brandName={brandName} logoUrl={brand.logo_url} active="training" isAdmin={Boolean(adminRes.data)} />
      <h1 className="gradient-text mb-1 text-3xl font-bold">{t("title")}</h1>
      <p className="mb-8 text-muted">{t("subtitle")}</p>
      <TrainingManager merchantId={merchantId} initialItems={(rows ?? []) as TrainingItem[]} />
    </div>
  );
}
