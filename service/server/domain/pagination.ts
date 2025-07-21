import { z } from "zod";

const PageSchema = z.object({
  currentPage: z.number().int().nonnegative(),
  prevPage: z.number().int().nonnegative(),
  nextPage: z.number().int().nonnegative(),
  totalPage: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  hasNext: z.boolean(),
});

type Page = z.infer<typeof PageSchema>;

const createPage = ({
  totalCount,
  limit,
  currentPage,
}: {
  totalCount: number;
  limit: number;
  currentPage: number;
}): Page => {
  const totalPage = Math.ceil(totalCount / limit);
  const hasNext = currentPage * limit < totalCount;

  return PageSchema.parse({
    currentPage: Math.max(currentPage, 1),
    prevPage: currentPage > 1 ? currentPage - 1 : 0,
    nextPage: hasNext && currentPage < totalPage ? currentPage + 1 : 0,
    totalPage: totalPage,
    totalCount: totalCount,
    hasNext: hasNext,
  });
};

export { PageSchema, type Page, createPage };
