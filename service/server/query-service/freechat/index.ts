import { Ok } from "@vspo-lab/error";
import type { Freechats } from "../../domain/freechat";
import { createPage, type Page } from "../../domain/pagination";
import type { IAppContext } from "../../infra/dependency";
import { withTracerResult } from "../../infra/http/trace";

export type ListFreechatsQuery = {
  limit: number;
  page: number;
  creatorIds?: string[];
  startedAtFrom?: Date;
  startedAtTo?: Date;
  languageCode: string;
  orderBy?: "asc" | "desc";
};

export type ListFreechatsResponse = {
  freechats: Freechats;
  pagination: Page;
};

export async function listFreechats(
  context: IAppContext,
  query: ListFreechatsQuery,
): Promise<ReturnType<typeof context.runInTx<ListFreechatsResponse>>> {
  return await withTracerResult("listFreechats", "execute", async () => {
    return context.runInTx(async (repos, _services) => {
      const freechats = await repos.freechatRepository.list(query);
      if (freechats.err) {
        return freechats;
      }

      const count = await repos.freechatRepository.count(query);
      if (count.err) {
        return count;
      }

      return Ok({
        freechats: freechats.val,
        pagination: createPage({
          currentPage: query.page,
          limit: query.limit,
          totalCount: count.val,
        }),
      });
    });
  });
}
