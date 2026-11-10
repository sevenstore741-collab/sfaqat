"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Kind = "keyword" | "qa" | "info";
type LangChoice = "any" | "ar" | "en";

export type TrainingItem = {
  id: string;
  kind: Kind;
  title: string | null;
  keywords: string[];
  content: string;
  lang: "ar" | "en" | null;
  is_active: boolean;
  created_at: string;
};

export default function TrainingManager({
  merchantId,
  initialItems,
}: {
  merchantId: string;
  initialItems: TrainingItem[];
}) {
  const t = useTranslations("Training");
  const [items, setItems] = useState<TrainingItem[]>(initialItems);
  const [kind, setKind] = useState<Kind>("keyword");
  const [title, setTitle] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [content, setContent] = useState("");
  const [lang, setLang] = useState<LangChoice>("any");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const keywords = keywordsText
      .split(/[,،\n]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (!content.trim()) return setError(t("errors.required"));
    if (kind === "keyword" && keywords.length === 0) return setError(t("errors.keywordsRequired"));

    setBusy(true);
    const { data, error: err } = await createClient()
      .from("bot_training_items")
      .insert({
        merchant_id: merchantId,
        kind,
        title: title.trim() || null,
        keywords,
        content: content.trim(),
        lang: lang === "any" ? null : lang,
      })
      .select()
      .single();
    setBusy(false);

    if (err || !data) {
      setError(err?.message.includes("training_limit_reached") ? t("errors.limit") : t("errors.generic"));
      return;
    }
    setItems((prev) => [data as TrainingItem, ...prev]);
    setTitle("");
    setKeywordsText("");
    setContent("");
  }

  async function toggle(item: TrainingItem) {
    const { error: err } = await createClient()
      .from("bot_training_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    if (err) return setError(t("errors.generic"));
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)));
  }

  async function remove(id: string) {
    const { error: err } = await createClient().from("bot_training_items").delete().eq("id", id);
    if (err) return setError(t("errors.generic"));
    setItems((prev) => prev.filter((i) => i.id !== id));
    setConfirmId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={add} className="glass flex flex-col gap-4 p-5">
        <h2 className="font-semibold">{t("addTitle")}</h2>

        <div className="flex flex-col gap-2">
          <span className="text-sm">{t("kindLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {(["keyword", "qa", "info"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  kind === k ? "btn-primary border-transparent" : "border-border bg-card"
                }`}
              >
                {t(`kinds.${k}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">{t(`hints.${kind}`)}</p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {t("fieldTitle")}
          <input className="input-glass" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("fieldKeywords")}
          <input className="input-glass" value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("fieldContent")}
          <textarea
            className="input-glass min-h-28"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("fieldLang")}
          <select className="input-glass" value={lang} onChange={(e) => setLang(e.target.value as LangChoice)}>
            <option value="any">{t("lang.any")}</option>
            <option value="ar">{t("lang.ar")}</option>
            <option value="en">{t("lang.en")}</option>
          </select>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary self-start rounded-xl px-6 py-2.5 font-medium disabled:opacity-60">
          {busy ? t("adding") : t("add")}
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          {t("listTitle")} ({items.length})
        </h2>
        {items.length === 0 && <p className="glass p-5 text-sm text-muted">{t("empty")}</p>}
        {items.map((item) => (
          <article key={item.id} className="glass flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
                {t(`kinds.${item.kind}`)}
              </span>
              <div className="flex items-center gap-2 text-sm">
                <button type="button" onClick={() => toggle(item)} className="rounded-lg border border-border px-3 py-1">
                  {item.is_active ? t("active") : t("disabled")}
                </button>
                {confirmId === item.id ? (
                  <>
                    <button type="button" onClick={() => remove(item.id)} className="rounded-lg bg-red-500 px-3 py-1 text-white">
                      {t("confirm")}
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg border border-border px-3 py-1">
                      {t("cancel")}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmId(item.id)} className="rounded-lg border border-border px-3 py-1 text-red-400">
                    {t("delete")}
                  </button>
                )}
              </div>
            </div>
            {item.title && <p className="font-medium">{item.title}</p>}
            {item.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.keywords.map((k) => (
                  <span key={k} className="rounded-md bg-black/20 px-2 py-0.5 text-xs">
                    {k}
                  </span>
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap text-sm text-muted">{item.content}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
