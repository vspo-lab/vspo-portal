import type { Clip, Pagination } from "../../shared/domain/clip";
import { paginationSchema } from "../../shared/domain/clip";

/**
 * Paginate clips
 *
 * @param clips The clips array for the current page
 * @param page Current page number (0-indexed)
 * @param itemsPerPage Number of items per page
 * @param totalItems Optional parameter for total items in collection (if known from API)
 */
export const paginateClips = (
  clips: Clip[],
  page: number,
  itemsPerPage: number,
  totalItems?: number,
): {
  clips: Clip[];
  pagination: Pagination;
} => {
  // If totalItems is provided, use it; otherwise use the length of the clips array
  const actualTotalItems = totalItems !== undefined ? totalItems : clips.length;

  // Calculate total pages as ceiling of totalItems/itemsPerPage
  const totalPages = Math.max(1, Math.ceil(actualTotalItems / itemsPerPage));

  // Adjust for 0-indexed pagination - page parameter is already 0-based
  // Ensure page is between 0 and (totalPages-1)
  const currentPage = Math.min(Math.max(0, page), totalPages - 1);

  // For the current page, we use the clips that were passed in
  // No need to slice if we're already working with the correct page of data
  const paginatedClips = clips;

  // Validate pagination information
  const pagination = paginationSchema.parse({
    currentPage,
    totalPages,
    totalItems: actualTotalItems,
    itemsPerPage,
  });

  return {
    clips: paginatedClips,
    pagination,
  };
};
