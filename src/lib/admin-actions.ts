"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };

const HEX = /^#[0-9a-fA-F]{6}$/;
const UUID = /^[0-9a-fA-F-]{36}$/;

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Error("لازم تسجل دخول");
  const { data: admin } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!admin) throw new Error("ما عندك صلاحية المالك");
}

function fail(e: unknown): Result {
  return { ok: false, error: e instanceof Error ? e.message : "صار خطأ، حاول مرة ثانية" };
}

function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function bounded(v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error("قيمة رقمية غير صحيحة");
  return n;
}

async function saveSetting(key: string, value: Record<string, unknown>): Promise<Result> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveBrand(input: {
  name_ar: string;
  name_en: string;
  tagline_ar: string;
  tagline_en: string;
  primary: string;
  accent: string;
  logo_url: string;
}): Promise<Result> {
  try {
    await requireAdmin();
    const value = {
      name_ar: text(input.name_ar, 60),
      name_en: text(input.name_en, 60),
      tagline_ar: text(input.tagline_ar, 120),
      tagline_en: text(input.tagline_en, 120),
      primary: text(input.primary, 7),
      accent: text(input.accent, 7),
      logo_url: text(input.logo_url, 500),
    };
    if (!value.name_ar || !value.name_en) throw new Error("اسم المنصة مطلوب بالعربي والإنجليزي");
    if (!HEX.test(value.primary) || !HEX.test(value.accent)) throw new Error("اللون لازم يكون بصيغة #RRGGBB");
    if (value.logo_url && !value.logo_url.startsWith("https://")) throw new Error("رابط الشعار لازم يبدأ بـ https://");
    return await saveSetting("brand", value);
  } catch (e) {
    return fail(e);
  }
}

export async function saveMessages(input: {
  welcome_ar: string;
  welcome_en: string;
  announcement_ar: string;
  announcement_en: string;
  trial_ending_ar: string;
  trial_ending_en: string;
}): Promise<Result> {
  try {
    await requireAdmin();
    const value = {
      welcome_ar: text(input.welcome_ar, 500),
      welcome_en: text(input.welcome_en, 500),
      announcement_ar: text(input.announcement_ar, 500),
      announcement_en: text(input.announcement_en, 500),
      trial_ending_ar: text(input.trial_ending_ar, 500),
      trial_ending_en: text(input.trial_ending_en, 500),
    };
    return await saveSetting("messages", value);
  } catch (e) {
    return fail(e);
  }
}

export async function savePlan(input: {
  id: string;
  name_ar: string;
  name_en: string;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  conversations: number;
  stores: number;
  whatsapp: boolean;
  cart_recovery: boolean;
}): Promise<Result> {
  try {
    await requireAdmin();
    if (!UUID.test(input.id)) throw new Error("باقة غير صحيحة");
    const name_ar = text(input.name_ar, 60);
    const name_en = text(input.name_en, 60);
    if (!name_ar || !name_en) throw new Error("اسم الباقة مطلوب بالعربي والإنجليزي");
    const admin = createAdminClient();
    const { error } = await admin
      .from("plans")
      .update({
        name_ar,
        name_en,
        price_monthly: bounded(input.price_monthly, 0, 100000),
        price_yearly: bounded(input.price_yearly, 0, 1000000),
        is_active: Boolean(input.is_active),
        limits: {
          conversations: Math.round(bounded(input.conversations, 0, 10000000)),
          stores: Math.round(bounded(input.stores, 0, 1000)),
        },
        features: {
          whatsapp: Boolean(input.whatsapp),
          cart_recovery: Boolean(input.cart_recovery),
        },
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createCoupon(input: {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_redemptions: number | null;
  expires_at: string | null;
}): Promise<Result> {
  try {
    await requireAdmin();
    const code = text(input.code, 32).toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new Error("الكود: 3 إلى 32 حرف إنجليزي أو رقم أو - أو _");
    const type = input.discount_type === "fixed" ? "fixed" : "percent";
    const value = bounded(input.discount_value, 0.01, type === "percent" ? 100 : 100000);
    const max = input.max_redemptions == null ? null : Math.round(bounded(input.max_redemptions, 1, 10000000));
    let expires: string | null = null;
    if (input.expires_at) {
      const d = new Date(`${input.expires_at}T23:59:59Z`);
      if (Number.isNaN(d.getTime())) throw new Error("تاريخ الانتهاء غير صحيح");
      expires = d.toISOString();
    }
    const admin = createAdminClient();
    const { error } = await admin.from("coupons").insert({
      code,
      discount_type: type,
      discount_value: value,
      max_redemptions: max,
      expires_at: expires,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "هذا الكود موجود من قبل" };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setCouponActive(id: string, active: boolean): Promise<Result> {
  try {
    await requireAdmin();
    if (!UUID.test(id)) throw new Error("كوبون غير صحيح");
    const { error } = await createAdminClient().from("coupons").update({ is_active: active }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCoupon(id: string): Promise<Result> {
  try {
    await requireAdmin();
    if (!UUID.test(id)) throw new Error("كوبون غير صحيح");
    const { error } = await createAdminClient().from("coupons").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return fail(e);
  }
}
