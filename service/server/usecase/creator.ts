import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type { Creators } from "../domain/creator";
import { createPage, type Page } from "../domain/pagination";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";

export type BatchUpsertCreatorsParam = Creators;

export type SearchByChannelIdsParam = {
  channel: {
    id: string;
    memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
  }[];
};

export type ListByMemberTypeParam = {
  limit: number;
  page: number;
  memberType?: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
  languageCode?: string;
};

export type ListCreatorsResponse = {
  creators: Creators;
  pagination: Page;
};

export type SearchByMemberTypeParam = {
  memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
  limit?: number;
  page?: number;
};

export type TranslateCreatorParam = {
  languageCode: string;
  creators: Creators;
};

export interface ICreatorInteractor {
  searchByChannelIds(
    params: SearchByChannelIdsParam,
  ): Promise<Result<Creators, AppError>>;
  searchByMemberType(
    params: SearchByMemberTypeParam,
  ): Promise<Result<Creators, AppError>>;
  batchUpsert(
    params: BatchUpsertCreatorsParam,
  ): Promise<Result<Creators, AppError>>;
  list(
    params: ListByMemberTypeParam,
  ): Promise<Result<ListCreatorsResponse, AppError>>;
  translateCreator(
    params: TranslateCreatorParam,
  ): Promise<Result<Creators, AppError>>;
}

export const createCreatorInteractor = (
  context: IAppContext,
): ICreatorInteractor => {
  const INTERACTOR_NAME = "CreatorInteractor";

  const searchByChannelIds = async (
    params: SearchByChannelIdsParam,
  ): Promise<Result<Creators, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "searchByChannelIds",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const sv = await services.creatorService.searchCreatorsByChannelIds(
            params.channel.map((v) => ({
              channelId: v.id,
              memberType: v.memberType,
            })),
          );
          if (sv.err) return sv;

          return Ok(sv.val);
        });
      },
    );
  };

  const batchUpsert = async (
    params: BatchUpsertCreatorsParam,
  ): Promise<Result<Creators, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "batchUpsert", async () => {
      return context.runInTx(async (repos, _services) => {
        const uv = await repos.creatorRepository.batchUpsert(params);
        if (uv.err) return uv;
        return Ok(uv.val);
      });
    });
  };

  const searchByMemberType = async (
    params: SearchByMemberTypeParam,
  ): Promise<Result<Creators, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "searchByMemberType",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const sv = await services.creatorService.searchCreatorsByMemberType({
            memberType: params.memberType,
          });
          if (sv.err) return sv;

          return Ok(sv.val);
        });
      },
    );
  };

  const list = async (
    params: ListByMemberTypeParam,
  ): Promise<Result<ListCreatorsResponse, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "list", async () => {
      return context.runInTx(async (repos, _services) => {
        const c = await repos.creatorRepository.list(params);
        if (c.err) return c;

        const count = await repos.creatorRepository.count(params);
        if (count.err) return count;

        return Ok({
          creators: c.val,
          pagination: createPage({
            currentPage: params.page,
            limit: params.limit,
            totalCount: count.val,
          }),
        });
      });
    });
  };

  const translateCreator = async (
    params: TranslateCreatorParam,
  ): Promise<Result<Creators, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "translateCreator",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const sv = await services.creatorService.translateCreators(params);
          if (sv.err) {
            return sv;
          }
          return Ok(sv.val);
        });
      },
    );
  };

  return {
    searchByChannelIds,
    batchUpsert,
    searchByMemberType,
    list,
    translateCreator,
  };
};
