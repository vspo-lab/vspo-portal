import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppProviders } from "@/components/AppProviders";
import { GoogleAnalytics } from "@/features/shared/components/Elements/Google/GoogleAnalytics";
import { LayoutShell } from "@/features/shared/components/Layout/LayoutShell";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://yt3.ggpht.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://yt3.ggpht.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body>
        <InitColorSchemeScript attribute="class" />
        <NextIntlClientProvider messages={messages}>
          <AppProviders>
            <LayoutShell>{children}</LayoutShell>
          </AppProviders>
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
