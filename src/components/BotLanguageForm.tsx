"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Lang = "ar" | "en";

export default function BotLanguageForm({ botId, initial }: { botId: string; initial: Lang }) {
  const t = useTranslations("Dashboard");
  const [value, setValue] = useState<Lang>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(next: Lang) {
    setValue(next);
    setStatus("saving");
    const { error } = await createClient().from("bots").update({ primary_lang: next }).eq("id", botId);
    setStatus(error ? "error" : "saved");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(["ar", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={value === l}
            onClick={() => save(l)}
            className={`rounded-lg border px-4 py-2 text-sm ${
              value === l ? "btn-primary border-transparent" : "border-border bg-card"
            }`}
          >
            {t(`botLang.${l}`)}
          </button>
        ))}
      </div>
      {status === "saved" && <p className="text-sm text-emerald-400">{t("saved")}</p>}
      {status === "error" && <p className="text-sm text-red-400">{t("saveError")}</p>}
    </div>
  );
}
