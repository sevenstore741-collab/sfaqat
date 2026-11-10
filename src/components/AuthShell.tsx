import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getSettings } from "@/lib/settings";

export default async function AuthShell({
  locale,
  title,
  subtitle,
  footer,
  children,
}: {
  locale: string;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const { brand } = await getSettings();
  const name = locale === "ar" ? brand.name_ar : brand.name_en;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="absolute top-4 end-4">
        <LocaleSwitcher />
      </div>
      <Link href="/" className="flex items-center justify-center gap-3">
        {brand.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo_url} alt={name} className="h-10 w-10 rounded-xl object-cover" />
        ) : (
          <span className="btn-primary grid h-10 w-10 place-items-center rounded-xl text-lg font-bold">
            {name.slice(0, 1)}
          </span>
        )}
        <span className="text-2xl font-bold">{name}</span>
      </Link>
      <div className="text-center">
        <h1 className="gradient-text text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-muted">{subtitle}</p>
      </div>
      <div className="glass p-6">{children}</div>
      <p className="text-center text-sm text-muted">{footer}</p>
    </main>
  );
}
