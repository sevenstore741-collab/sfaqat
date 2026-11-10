"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const t = useTranslations("Dashboard");
  const router = useRouter();

  async function onClick() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition hover:border-primary"
    >
      {t("signOut")}
    </button>
  );
}
