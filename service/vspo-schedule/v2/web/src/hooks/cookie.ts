import { useEffect, useState } from "react";
import { getCookieValue } from "@/lib/utils";

export const useCookie = (key: string, initialValue?: string) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(getCookie(key));
  }, [key]);

  const setCookie = (newValue: string | undefined) => {
    if (newValue === undefined) {
      document.cookie = `${key}=; expires=${new Date(0).toUTCString()}; path=/;`;
    } else {
      document.cookie = `${key}=${encodeURIComponent(newValue)}; max-age=34560000; path=/;`;
    }
    setValue(newValue);
  };

  return [value, setCookie] as const;
};

const getCookie = (key: string) => {
  if (typeof document === "undefined") {
    return undefined;
  }
  return getCookieValue(key, document.cookie);
};
