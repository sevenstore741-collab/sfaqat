"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) {
        setError(t("errors.invalidLogin"));
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(`${t("errors.generic")} (${err instanceof Error ? err.message : "network"})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t("email")}
        <input
          type="email"
          dir="ltr"
          className="input-glass text-start"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("password")}
        <input
          type="password"
          dir="ltr"
          className="input-glass text-start"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary rounded-xl px-4 py-2.5 font-medium disabled:opacity-60">
        {loading ? t("loading") : t("loginSubmit")}
      </button>
    </form>
  );
}
