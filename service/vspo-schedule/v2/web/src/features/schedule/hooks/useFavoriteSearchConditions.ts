import { useCallback, useEffect, useState } from "react";
import { useCookie } from "@/hooks/cookie";
import { safeParseJson } from "@/lib/json";
import {
  type FavoriteSearchCondition,
  favoriteSearchConditionSchema,
} from "../types/favorite";

const FAVORITE_SEARCH_CONDITION_COOKIE = "favorite-search-condition";

export const useFavoriteSearchCondition = () => {
  const [cookieValue, setCookieValue] = useCookie(
    FAVORITE_SEARCH_CONDITION_COOKIE,
  );
  const [favorite, setFavorite] = useState<FavoriteSearchCondition | null>(
    null,
  );

  useEffect(() => {
    if (!cookieValue) {
      setFavorite(null);
      return;
    }

    let cancelled = false;
    void safeParseJson(cookieValue, favoriteSearchConditionSchema).then(
      (parsed) => {
        if (cancelled) return;
        setFavorite(parsed.val ?? null);
      },
    );

    return () => {
      cancelled = true;
    };
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
    favorite,
    saveFavorite,
    deleteFavorite,
    hasFavorite: favorite !== null,
  };
};
