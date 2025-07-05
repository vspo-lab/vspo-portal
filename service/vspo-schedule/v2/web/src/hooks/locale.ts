import { DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/Const";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useCookie } from "./cookie";

export const useLocale = () => {
  const router = useRouter();
  const [localeCookie, setLocaleCookie] = useCookie(
    LOCALE_COOKIE,
    DEFAULT_LOCALE,
  );

  const setLocale = (locale: string) => {
    if (locale !== router.locale) {
      setLocaleCookie(locale);
      router.push(router.asPath, undefined, { scroll: false, locale });
    }
  };

  useEffect(() => {
    if (localeCookie !== router.locale) {
      setLocaleCookie(router.locale ?? DEFAULT_LOCALE);
    }
  }, [router.locale, localeCookie, setLocaleCookie]);

  return {
    locale: router.locale ?? DEFAULT_LOCALE,
    setLocale,
  };
};
