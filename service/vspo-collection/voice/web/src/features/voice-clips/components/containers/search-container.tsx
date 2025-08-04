"use client";

import { Filter, Search } from "lucide-react";
import { useState } from "react";
import type { Category, Member } from "../../domain/models/voice-clip.model";

interface SearchContainerProps {
  members: Member[];
  categories: Category[];
  popularSearches: string[];
  onSearch: (searchTerm: string, filters: SearchFilters) => void;
}

export interface SearchFilters {
  categoryId: string;
  memberId: string;
}

export function SearchContainer({
  members,
  categories,
  popularSearches,
  onSearch,
}: SearchContainerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMember, setSelectedMember] = useState("all");
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = () => {
    onSearch(searchInput, {
      categoryId: selectedCategory,
      memberId: selectedMember,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePopularSearchClick = (keyword: string) => {
    setSearchInput(keyword);
    setSearchFocused(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4 md:mt-6">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-amber-600/30 shadow-sm dark:shadow-none">
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 dark:text-amber-600 w-5 h-5" />
              <input
                type="text"
                placeholder="クリップを検索..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="w-full pl-10 pr-12 py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-amber-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-gray-900 dark:text-amber-100 placeholder-gray-500 dark:placeholder-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowSearchFilters(!showSearchFilters)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                <Filter className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 md:px-6 py-3 bg-amber-600 text-white dark:text-zinc-900 rounded-lg hover:bg-amber-700 dark:hover:bg-amber-500 transition-colors font-medium"
            >
              検索
            </button>
          </div>

          {/* Popular searches */}
          {searchFocused && searchInput === "" && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 dark:text-amber-200">
                人気の検索
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((keyword) => (
                  <button
                    type="button"
                    key={keyword}
                    onClick={() => handlePopularSearchClick(keyword)}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-amber-100 rounded-full hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search filters */}
          {showSearchFilters && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-amber-600/20">
              <div>
                <label
                  htmlFor="category-select"
                  className="text-sm text-gray-700 dark:text-amber-200 mb-2 block"
                >
                  カテゴリ
                </label>
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-amber-600/30 rounded-lg text-gray-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="member-select"
                  className="text-sm text-gray-700 dark:text-amber-200 mb-2 block"
                >
                  メンバー
                </label>
                <select
                  id="member-select"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-amber-600/30 rounded-lg text-gray-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
