"use client";

// src/hooks/locale.ts
import { useSearchParams } from "next/navigation";
import { useLocale as useNextIntlLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export const useLocale = () => {
  const locale = useNextIntlLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setLocale = (newLocale: string) => {
    if (newLocale !== locale) {
      const search = searchParams.toString();
      const href = search ? `${pathname}?${search}` : pathname;
      router.replace(href, { locale: newLocale, scroll: false });
    }
  };

  return { locale, setLocale };
};
