import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type { Freechats } from "../domain/freechat";
import { createPage, type Page } from "../domain/pagination";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";

export type BatchUpsertFreechatsParam = Freechats;

export type ListFreechatsQuery = {
  limit: number;
  page: number;
  memberType?: string;
  languageCode: string; // ISO 639-1 language code or [default] explicitly specified to narrow down to 1creator
  orderBy?: "asc" | "desc";
  orderKey?: "publishedAt" | "creatorName";
  channelIds?: string[];
  includeDeleted?: boolean;
};

export type ListFreechatsResponse = {
  freechats: Freechats;
  pagination: Page;
};

export interface IFreechatInteractor {
  list(
    query: ListFreechatsQuery,
  ): Promise<Result<ListFreechatsResponse, AppError>>;
}

export const createFreechatInteractor = (
  context: IAppContext,
): IFreechatInteractor => {
  const INTERACTOR_NAME = "FreechatInteractor";

  const list = async (
    query: ListFreechatsQuery,
  ): Promise<Result<ListFreechatsResponse, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "list", async () => {
      return context.runInTx(async (repos, _services) => {
        const freechats = await repos.freechatRepository.list(query);

        if (freechats.err) {
          return freechats;
        }

        const pagination = await repos.freechatRepository.count(query);

        if (pagination.err) {
          return pagination;
        }

        return Ok({
          freechats: freechats.val,
          pagination: createPage({
            currentPage: query.page,
            limit: query.limit,
            totalCount: pagination.val,
          }),
        });
      });
    });
  };

  return {
    list,
  };
};
