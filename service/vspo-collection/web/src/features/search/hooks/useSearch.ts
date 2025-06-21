"use client";

import { useCallback, useState } from "react";
import type {
  PopularSearch,
  RecentSearch,
  SearchFilters,
  SearchResults,
  SearchState,
  SearchSuggestion,
} from "../types";

const initialFilters: SearchFilters = {
  contentType: "all",
  platform: "all",
  dateRange: "all",
  sortBy: "relevance",
  query: "",
};

const initialState: SearchState = {
  query: "",
  filters: initialFilters,
  results: null,
  suggestions: [],
  recentSearches: [],
  popularSearches: [],
  isLoading: false,
  isLoadingSuggestions: false,
  error: null,
  hasSearched: false,
  showAdvancedFilters: false,
};

export const useSearch = () => {
  const [searchState, setSearchState] = useState<SearchState>(initialState);

  const updateQuery = useCallback((query: string) => {
    setSearchState((prev) => ({
      ...prev,
      query,
      filters: { ...prev.filters, query },
    }));
  }, []);

  const updateFilters = useCallback(
    <T extends keyof SearchFilters>(filterType: T, value: SearchFilters[T]) => {
      setSearchState((prev) => ({
        ...prev,
        filters: { ...prev.filters, [filterType]: value },
      }));
    },
    [],
  );

  const setResults = useCallback((results: SearchResults | null) => {
    setSearchState((prev) => ({ ...prev, results }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setSearchState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setSearchState((prev) => ({ ...prev, error }));
  }, []);

  const setHasSearched = useCallback((hasSearched: boolean) => {
    setSearchState((prev) => ({ ...prev, hasSearched }));
  }, []);

  const setSuggestions = useCallback((suggestions: SearchSuggestion[]) => {
    setSearchState((prev) => ({ ...prev, suggestions }));
  }, []);

  const addRecentSearch = useCallback((search: RecentSearch) => {
    setSearchState((prev) => ({
      ...prev,
      recentSearches: [search, ...prev.recentSearches.slice(0, 9)],
    }));
  }, []);

  const toggleAdvancedFilters = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      showAdvancedFilters: !prev.showAdvancedFilters,
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      query: "",
      filters: { ...prev.filters, query: "" },
      results: null,
      hasSearched: false,
      error: null,
    }));
  }, []);

  const resetState = useCallback(() => {
    setSearchState(initialState);
  }, []);

  return {
    searchState,
    updateQuery,
    updateFilters,
    setResults,
    setLoading,
    setError,
    setHasSearched,
    setSuggestions,
    addRecentSearch,
    toggleAdvancedFilters,
    clearSearch,
    resetState,
  };
};
