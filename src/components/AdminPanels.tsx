"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveBrand,
  saveMessages,
  savePlan,
  createCoupon,
  setCouponActive,
  deleteCoupon,
} from "@/lib/admin-actions";
import type { Brand, Messages } from "@/lib/settings";

type Status = { ok: boolean; text: string } | null;

export type AdminPlan = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  is_active: boolean;
  conversations: number;
  stores: number;
  whatsapp: boolean;
  cart_recovery: boolean;
};

export type AdminCoupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_redemptions: number | null;
  redeemed_count: number;
  expires_at: string | null;
  is_active: boolean;
};

function StatusLine({ s }: { s: Status }) {
  if (!s) return null;
  return <p className={`text-sm ${s.ok ? "text-emerald-400" : "text-red-400"}`}>{s.text}</p>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function BrandForm({ initial }: { initial: Brand }) {
  const [b, setB] = useState<Brand>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const set = (k: keyof Brand) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setB({ ...b, [k]: e.target.value });

  async function save() {
    setBusy(true);
    setStatus(null);
    const res = await saveBrand(b);
    setBusy(false);
    setStatus(res.ok ? { ok: true, text: "تم الحفظ وتطبيق الهوية على المنصة" } : { ok: false, text: res.error });
  }

  return (
    <div className="glass flex flex-col gap-4 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="اسم المنصة بالعربي">
          <input className="input-glass" value={b.name_ar} onChange={set("name_ar")} maxLength={60} />
        </Field>
        <Field label="اسم المنصة بالإنجليزي">
          <input className="input-glass" dir="ltr" value={b.name_en} onChange={set("name_en")} maxLength={60} />
        </Field>
        <Field label="الشعار الفرعي بالعربي">
          <input className="input-glass" value={b.tagline_ar} onChange={set("tagline_ar")} maxLength={120} />
        </Field>
        <Field label="الشعار الفرعي بالإنجليزي">
          <input className="input-glass" dir="ltr" value={b.tagline_en} onChange={set("tagline_en")} maxLength={120} />
        </Field>
        <Field label="اللون الأساسي">
          <div className="flex gap-2">
            <input type="color" value={b.primary} onChange={set("primary")} className="h-10 w-14 rounded-lg border border-border bg-transparent" />
            <input className="input-glass" dir="ltr" value={b.primary} onChange={set("primary")} maxLength={7} />
          </div>
        </Field>
        <Field label="اللون الثانوي">
          <div className="flex gap-2">
            <input type="color" value={b.accent} onChange={set("accent")} className="h-10 w-14 rounded-lg border border-border bg-transparent" />
            <input className="input-glass" dir="ltr" value={b.accent} onChange={set("accent")} maxLength={7} />
          </div>
        </Field>
      </div>
      <Field label="رابط الشعار (اختياري)" hint="رابط صورة مباشر يبدأ بـ https://">
        <input className="input-glass" dir="ltr" value={b.logo_url} onChange={set("logo_url")} maxLength={500} />
      </Field>

      <div
        className="glass flex items-center gap-3 p-4"
        style={{ "--primary": b.primary, "--accent": b.accent } as React.CSSProperties}
      >
        {b.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
        ) : (
          <span className="btn-primary grid h-10 w-10 place-items-center rounded-xl font-bold">
            {(b.name_ar || b.name_en).slice(0, 1)}
          </span>
        )}
        <div>
          <p className="font-bold">{b.name_ar || b.name_en}</p>
          <p className="text-xs text-muted">{b.tagline_ar}</p>
        </div>
        <span className="btn-primary ms-auto rounded-lg px-4 py-1.5 text-sm">معاينة</span>
      </div>

      <StatusLine s={status} />
      <button type="button" onClick={save} disabled={busy} className="btn-primary self-start rounded-xl px-6 py-2.5 font-medium disabled:opacity-60">
        {busy ? "جاري الحفظ..." : "حفظ الهوية"}
      </button>
    </div>
  );
}

const MESSAGE_FIELDS: { key: keyof Messages; label: string; hint?: string }[] = [
  { key: "welcome_ar", label: "رسالة الترحيب (عربي)", hint: "استخدم {name} لاسم التاجر" },
  { key: "welcome_en", label: "رسالة الترحيب (إنجليزي)", hint: "Use {name} for the merchant name" },
  { key: "announcement_ar", label: "إشعار عام للتجار (عربي)", hint: "يظهر في أعلى لوحة التاجر، اتركه فاضي لإخفائه" },
  { key: "announcement_en", label: "إشعار عام للتجار (إنجليزي)" },
  { key: "trial_ending_ar", label: "تنبيه قرب انتهاء التجربة (عربي)", hint: "يظهر لما يتبقى يومان أو أقل" },
  { key: "trial_ending_en", label: "تنبيه قرب انتهاء التجربة (إنجليزي)" },
];

export function MessagesForm({ initial }: { initial: Messages }) {
  const [m, setM] = useState<Messages>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function save() {
    setBusy(true);
    setStatus(null);
    const res = await saveMessages(m);
    setBusy(false);
    setStatus(res.ok ? { ok: true, text: "تم حفظ الرسائل" } : { ok: false, text: res.error });
  }

  return (
    <div className="glass flex flex-col gap-4 p-5">
      {MESSAGE_FIELDS.map((f) => (
        <Field key={f.key} label={f.label} hint={f.hint}>
          <textarea
            className="input-glass min-h-20"
            value={m[f.key]}
            onChange={(e) => setM({ ...m, [f.key]: e.target.value })}
            maxLength={500}
          />
        </Field>
      ))}
      <StatusLine s={status} />
      <button type="button" onClick={save} disabled={busy} className="btn-primary self-start rounded-xl px-6 py-2.5 font-medium disabled:opacity-60">
        {busy ? "جاري الحفظ..." : "حفظ الرسائل"}
      </button>
    </div>
  );
}

function PlanEditor({ plan }: { plan: AdminPlan }) {
  const [p, setP] = useState<AdminPlan>(plan);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const num = (k: keyof AdminPlan) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP({ ...p, [k]: Number(e.target.value) });

  async function save() {
    setBusy(true);
    setStatus(null);
    const res = await savePlan({
      id: p.id,
      name_ar: p.name_ar,
      name_en: p.name_en,
      price_monthly: p.price_monthly,
      price_yearly: p.price_yearly,
      is_active: p.is_active,
      conversations: p.conversations,
      stores: p.stores,
      whatsapp: p.whatsapp,
      cart_recovery: p.cart_recovery,
    });
    setBusy(false);
    setStatus(res.ok ? { ok: true, text: "تم حفظ الباقة" } : { ok: false, text: res.error });
  }

  return (
    <div className="glass flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">
          {p.code} <span className="text-xs text-muted">({p.currency})</span>
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={p.is_active} onChange={(e) => setP({ ...p, is_active: e.target.checked })} />
          ظاهرة للعملاء
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="الاسم بالعربي">
          <input className="input-glass" value={p.name_ar} onChange={(e) => setP({ ...p, name_ar: e.target.value })} />
        </Field>
        <Field label="الاسم بالإنجليزي">
          <input className="input-glass" dir="ltr" value={p.name_en} onChange={(e) => setP({ ...p, name_en: e.target.value })} />
        </Field>
        <Field label="السعر الشهري">
          <input type="number" min={0} step="0.01" className="input-glass" dir="ltr" value={p.price_monthly} onChange={num("price_monthly")} />
        </Field>
        <Field label="السعر السنوي">
          <input type="number" min={0} step="0.01" className="input-glass" dir="ltr" value={p.price_yearly} onChange={num("price_yearly")} />
        </Field>
        <Field label="حد المحادثات شهريًا">
          <input type="number" min={0} className="input-glass" dir="ltr" value={p.conversations} onChange={num("conversations")} />
        </Field>
        <Field label="عدد المتاجر">
          <input type="number" min={0} className="input-glass" dir="ltr" value={p.stores} onChange={num("stores")} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={p.whatsapp} onChange={(e) => setP({ ...p, whatsapp: e.target.checked })} />
          ربط واتساب
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={p.cart_recovery} onChange={(e) => setP({ ...p, cart_recovery: e.target.checked })} />
          استرجاع السلات
        </label>
      </div>
      <StatusLine s={status} />
      <button type="button" onClick={save} disabled={busy} className="btn-primary self-start rounded-xl px-6 py-2.5 font-medium disabled:opacity-60">
        {busy ? "جاري الحفظ..." : "حفظ الباقة"}
      </button>
    </div>
  );
}

export function PlansForm({ plans }: { plans: AdminPlan[] }) {
  return (
    <div className="flex flex-col gap-4">
      {plans.map((p) => (
        <PlanEditor key={p.id} plan={p} />
      ))}
    </div>
  );
}

export function CouponsManager({ coupons }: { coupons: AdminCoupon[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [max, setMax] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function add() {
    setBusy(true);
    setStatus(null);
    const res = await createCoupon({
      code,
      discount_type: type,
      discount_value: Number(value),
      max_redemptions: max.trim() ? Number(max) : null,
      expires_at: expires || null,
    });
    setBusy(false);
    if (res.ok) {
      setStatus({ ok: true, text: "تمت إضافة الكوبون" });
      setCode("");
      setMax("");
      setExpires("");
      router.refresh();
    } else {
      setStatus({ ok: false, text: res.error });
    }
  }

  async function toggle(c: AdminCoupon) {
    const res = await setCouponActive(c.id, !c.is_active);
    if (res.ok) router.refresh();
    else setStatus({ ok: false, text: res.error });
  }

  async function remove(c: AdminCoupon) {
    if (!window.confirm(`حذف الكوبون ${c.code}؟`)) return;
    const res = await deleteCoupon(c.id);
    if (res.ok) router.refresh();
    else setStatus({ ok: false, text: res.error });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass flex flex-col gap-4 p-5">
        <h3 className="font-bold">إضافة كوبون جديد</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="كود الكوبون" hint="حروف إنجليزية وأرقام فقط">
            <input className="input-glass" dir="ltr" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={32} />
          </Field>
          <Field label="نوع الخصم">
            <select className="input-glass" value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
              <option value="percent">نسبة مئوية %</option>
              <option value="fixed">مبلغ ثابت</option>
            </select>
          </Field>
          <Field label="قيمة الخصم">
            <input type="number" min={0} step="0.01" className="input-glass" dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Field label="الحد الأقصى للاستخدام (اختياري)">
            <input type="number" min={1} className="input-glass" dir="ltr" value={max} onChange={(e) => setMax(e.target.value)} />
          </Field>
          <Field label="تاريخ الانتهاء (اختياري)">
            <input type="date" className="input-glass" dir="ltr" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </Field>
        </div>
        <StatusLine s={status} />
        <button type="button" onClick={add} disabled={busy} className="btn-primary self-start rounded-xl px-6 py-2.5 font-medium disabled:opacity-60">
          {busy ? "جاري الإضافة..." : "إضافة الكوبون"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-bold">الكوبونات ({coupons.length})</h3>
        {coupons.length === 0 && <p className="glass p-5 text-sm text-muted">ما فيه كوبونات بعد.</p>}
        {coupons.map((c) => (
          <div key={c.id} className="glass flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-mono text-lg font-bold" dir="ltr">
                {c.code}
              </p>
              <p className="text-xs text-muted">
                {c.discount_type === "percent" ? `${c.discount_value}%` : `${c.discount_value} ثابت`} · استُخدم{" "}
                {c.redeemed_count}
                {c.max_redemptions ? ` من ${c.max_redemptions}` : ""} · ينتهي {c.expires_at ? c.expires_at.slice(0, 10) : "—"}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button type="button" onClick={() => toggle(c)} className="rounded-lg border border-border px-3 py-1">
                {c.is_active ? "مفعّل" : "متوقف"}
              </button>
              <button type="button" onClick={() => remove(c)} className="rounded-lg border border-border px-3 py-1 text-red-400">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
