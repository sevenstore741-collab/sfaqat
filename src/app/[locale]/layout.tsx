import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter, Tajawal } from "next/font/google";
import { routing } from "@/i18n/routing";
import { DEFAULT_BRAND, getSettings, safeHex } from "@/lib/settings";
import "../globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { brand } = await getSettings();
  const isAr = locale === "ar";
  const name = isAr ? brand.name_ar : brand.name_en;
  const tagline = isAr ? brand.tagline_ar : brand.tagline_en;
  return { title: `${name} | ${tagline}`, description: tagline };
}

const themeScript = `try{var t=localStorage.getItem("sfaqat-theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const { brand } = await getSettings();

  const style = {
    "--primary": safeHex(brand.primary, DEFAULT_BRAND.primary),
    "--accent": safeHex(brand.accent, DEFAULT_BRAND.accent),
  } as React.CSSProperties;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme="dark"
      className={`${inter.variable} ${tajawal.variable}`}
      style={style}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
