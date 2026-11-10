import { createClient } from "@supabase/supabase-js";

export type Brand = {
  name_ar: string;
  name_en: string;
  tagline_ar: string;
  tagline_en: string;
  primary: string;
  accent: string;
  logo_url: string;
};

export type Messages = {
  welcome_ar: string;
  welcome_en: string;
  announcement_ar: string;
  announcement_en: string;
  trial_ending_ar: string;
  trial_ending_en: string;
};

export type PublicPlan = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  limits: { stores?: number; conversations?: number };
  features: { whatsapp?: boolean; cart_recovery?: boolean };
};

export const DEFAULT_BRAND: Brand = {
  name_ar: "صَفَقَات",
  name_en: "Sfaqat",
  tagline_ar: "بائعك الآلي الذكي",
  tagline_en: "Your AI sales closer",
  primary: "#6366f1",
  accent: "#22d3ee",
  logo_url: "",
};

export const DEFAULT_MESSAGES: Messages = {
  welcome_ar: "أهلاً {name}، يسعدنا انضمامك! جهّز بوتك وابدأ استقبال عملائك.",
  welcome_en: "Welcome {name}! Set up your bot and start serving your customers.",
  announcement_ar: "",
  announcement_en: "",
  trial_ending_ar: "تجربتك المجانية على وشك الانتهاء. اختر باقتك عشان ما يتوقف بوتك.",
  trial_ending_en: "Your free trial is ending soon. Pick a plan so your bot keeps running.",
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function safeHex(value: string, fallback: string): string {
  return HEX.test(value) ? value : fallback;
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function merge<T extends Record<string, string>>(defaults: T, row: Record<string, unknown>): T {
  const out = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const v = row[key as string];
    if (typeof v === "string" && v.trim() !== "") out[key] = v as T[keyof T];
  }
  return out;
}

export async function getSettings(): Promise<{ brand: Brand; messages: Messages }> {
  const fallback = { brand: DEFAULT_BRAND, messages: DEFAULT_MESSAGES };
  const supabase = publicClient();
  if (!supabase) return fallback;
  try {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["brand", "messages"]);
    const rows = (data ?? []) as { key: string; value: Record<string, unknown> }[];
    const brandRow = rows.find((r) => r.key === "brand")?.value ?? {};
    const msgRow = rows.find((r) => r.key === "messages")?.value ?? {};
    return {
      brand: merge(DEFAULT_BRAND, brandRow),
      messages: merge(DEFAULT_MESSAGES, msgRow),
    };
  } catch {
    return fallback;
  }
}

export async function getPlans(): Promise<PublicPlan[]> {
  const supabase = publicClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("plans")
      .select("id, code, name_ar, name_en, price_monthly, price_yearly, currency, limits, features")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });
    return ((data ?? []) as Record<string, unknown>[]).map((p) => ({
      id: String(p.id),
      code: String(p.code),
      name_ar: String(p.name_ar),
      name_en: String(p.name_en),
      price_monthly: Number(p.price_monthly ?? 0),
      price_yearly: Number(p.price_yearly ?? 0),
      currency: String(p.currency ?? "SAR"),
      limits: (p.limits ?? {}) as PublicPlan["limits"],
      features: (p.features ?? {}) as PublicPlan["features"],
    }));
  } catch {
    return [];
  }
}
