import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { notFound } from "next/navigation";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppProviders } from "@/components/AppProviders";
import { GoogleAnalytics } from "@/features/shared/components/Elements/Google/GoogleAnalytics";
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
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
        <GoogleAnalytics />
        {process.env.ENV === "production" &&
          process.env.NEXT_PUBLIC_ADS_GOOGLE && (
            <Script
              src={process.env.NEXT_PUBLIC_ADS_GOOGLE}
              strategy="afterInteractive"
              crossOrigin="anonymous"
            />
          )}
      </body>
    </html>
  );
}
