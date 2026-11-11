"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName, lang: locale },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard`,
      },
    });
    setLoading(false);

    if (error) {
      if (error.code === "user_already_exists") setError(t("errors.userExists"));
      else if (error.code === "weak_password") setError(t("errors.weakPassword"));
      else setError(t("errors.generic"));
      return;
    }
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
    } else {
      setNotice(t("checkEmail"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t("businessName")}
        <input
          className="input-glass"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          maxLength={120}
        />
      </label>
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
          minLength={8}
          autoComplete="new-password"
        />
        <span className="text-xs text-muted">{t("passwordHint")}</span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {notice && <p className="text-sm text-emerald-400">{notice}</p>}
      <button type="submit" disabled={loading} className="btn-primary rounded-xl px-4 py-2.5 font-medium disabled:opacity-60">
        {loading ? t("loading") : t("signupSubmit")}
      </button>
    </form>
  );
}
