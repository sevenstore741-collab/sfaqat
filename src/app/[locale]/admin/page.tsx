import { setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import AppHeader from "@/components/AppHeader";
import {
  BrandForm,
  MessagesForm,
  PlansForm,
  CouponsManager,
  type AdminPlan,
  type AdminCoupon,
} from "@/components/AdminPanels";

const TABS = [
  { key: "brand", label: "الهوية البصرية" },
  { key: "messages", label: "الرسائل والإشعارات" },
  { key: "plans", label: "الباقات والأسعار" },
  { key: "coupons", label: "الكوبونات" },
] as const;

type Row = Record<string, unknown>;

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab: rawTab } = await searchParams;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return redirect({ href: "/login", locale });

  const { data: adminRow } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!adminRow) return redirect({ href: "/dashboard", locale });

  const tab = TABS.find((t) => t.key === rawTab)?.key ?? "brand";
  const { brand, messages } = await getSettings();
  const admin = createAdminClient();

  let plans: AdminPlan[] = [];
  let coupons: AdminCoupon[] = [];

  if (tab === "plans") {
    const { data } = await admin.from("plans").select("*").order("price_monthly", { ascending: true });
    plans = ((data ?? []) as Row[]).map((p) => {
      const limits = (p.limits ?? {}) as { stores?: number; conversations?: number };
      const features = (p.features ?? {}) as { whatsapp?: boolean; cart_recovery?: boolean };
      return {
        id: String(p.id),
        code: String(p.code),
        name_ar: String(p.name_ar),
        name_en: String(p.name_en),
        price_monthly: Number(p.price_monthly ?? 0),
        price_yearly: Number(p.price_yearly ?? 0),
        currency: String(p.currency ?? "SAR"),
        is_active: Boolean(p.is_active),
        conversations: Number(limits.conversations ?? 0),
        stores: Number(limits.stores ?? 0),
        whatsapp: Boolean(features.whatsapp),
        cart_recovery: Boolean(features.cart_recovery),
      };
    });
  }

  if (tab === "coupons") {
    const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
    coupons = ((data ?? []) as Row[]).map((c) => ({
      id: String(c.id),
      code: String(c.code),
      discount_type: c.discount_type === "fixed" ? "fixed" : "percent",
      discount_value: Number(c.discount_value ?? 0),
      max_redemptions: c.max_redemptions == null ? null : Number(c.max_redemptions),
      redeemed_count: Number(c.redeemed_count ?? 0),
      expires_at: c.expires_at ? String(c.expires_at) : null,
      is_active: Boolean(c.is_active),
    }));
  }

  const brandName = locale === "ar" ? brand.name_ar : brand.name_en;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 py-6">
      <AppHeader brandName={brandName} logoUrl={brand.logo_url} active="admin" isAdmin />
      <h1 className="gradient-text mb-6 text-3xl font-bold">لوحة المالك</h1>

      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={`rounded-lg border px-4 py-2 text-sm ${
              tab === t.key ? "btn-primary border-transparent" : "border-border bg-card"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "brand" && <BrandForm initial={brand} />}
      {tab === "messages" && <MessagesForm initial={messages} />}
      {tab === "plans" && <PlansForm plans={plans} />}
      {tab === "coupons" && <CouponsManager coupons={coupons} />}
    </div>
  );
}
