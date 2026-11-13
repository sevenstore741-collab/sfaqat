import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import SignOutButton from "@/components/SignOutButton";

export default async function AppHeader({
  brandName,
  logoUrl,
  active,
  isAdmin,
}: {
  brandName: string;
  logoUrl: string;
  active: "dashboard" | "training" | "admin";
  isAdmin: boolean;
}) {
  const t = await getTranslations("Nav");
  const tabs: { key: string; href: string; label: string }[] = [
    { key: "dashboard", href: "/dashboard", label: t("dashboard") },
    { key: "training", href: "/dashboard/training", label: t("training") },
  ];
  if (isAdmin) tabs.push({ key: "admin", href: "/admin", label: t("admin") });

  return (
    <header className="glass mb-8 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={brandName} className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <span className="btn-primary grid h-9 w-9 place-items-center rounded-xl font-bold">
            {brandName.slice(0, 1)}
          </span>
        )}
        <span className="text-lg font-bold">{brandName}</span>
      </div>
      <nav className="flex items-center gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              active === tab.key ? "btn-primary" : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <SignOutButton />
      </div>
    </header>
  );
}
