"use client";

// src/hooks/locale.ts
import { useLocale as useNextIntlLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export const useLocale = () => {
  const locale = useNextIntlLocale();
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = (newLocale: string) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale, scroll: false });
    }
  };

  return { locale, setLocale };
};
