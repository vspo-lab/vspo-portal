import { useCookie } from "@/hooks/cookie";
import { useCallback } from "react";
import type { FavoriteSearchCondition } from "../types/favorite";

const FAVORITE_SEARCH_CONDITION_COOKIE = "favorite-search-condition";

export const useFavoriteSearchCondition = () => {
  const [cookieValue, setCookieValue] = useCookie(
    FAVORITE_SEARCH_CONDITION_COOKIE,
  );

  const getFavorite = useCallback((): FavoriteSearchCondition | null => {
    if (!cookieValue) return null;

    try {
      return JSON.parse(cookieValue) as FavoriteSearchCondition;
    } catch {
      return null;
    }
  }, [cookieValue]);

  const saveFavorite = useCallback(
    (condition: Omit<FavoriteSearchCondition, "createdAt">) => {
      const newCondition: FavoriteSearchCondition = {
        ...condition,
        createdAt: new Date().toISOString(),
      };

      setCookieValue(JSON.stringify(newCondition));
      return newCondition;
    },
    [setCookieValue],
  );

  const deleteFavorite = useCallback(() => {
    setCookieValue(undefined);
  }, [setCookieValue]);

  return {
    favorite: getFavorite(),
    saveFavorite,
    deleteFavorite,
    hasFavorite: !!getFavorite(),
  };
};
