import { getCurrentUTCString } from "@vspo-lab/dayjs";
import { useCallback } from "react";
import { useCookie } from "@/hooks/cookie";
import {
  type FavoriteSearchCondition,
  favoriteSearchConditionSchema,
} from "../types/favorite";

const FAVORITE_SEARCH_CONDITION_COOKIE = "favorite-search-condition";

export const useFavoriteSearchCondition = () => {
  const [cookieValue, setCookieValue] = useCookie(
    FAVORITE_SEARCH_CONDITION_COOKIE,
  );

  const getFavorite = useCallback((): FavoriteSearchCondition | null => {
    if (!cookieValue) return null;

    // try-catch retained: wraps sync JSON.parse which cannot use async wrap()
    try {
      const parsed = favoriteSearchConditionSchema.safeParse(
        JSON.parse(cookieValue),
      );
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }, [cookieValue]);

  const saveFavorite = useCallback(
    (condition: Omit<FavoriteSearchCondition, "createdAt">) => {
      const newCondition: FavoriteSearchCondition = {
        ...condition,
        createdAt: getCurrentUTCString(),
      };

      setCookieValue(JSON.stringify(newCondition));
      return newCondition;
    },
    [setCookieValue],
  );

  const deleteFavorite = useCallback(() => {
    setCookieValue(undefined);
  }, [setCookieValue]);

  const favorite = getFavorite();
  return {
    favorite,
    saveFavorite,
    deleteFavorite,
    hasFavorite: !!favorite,
  };
};
