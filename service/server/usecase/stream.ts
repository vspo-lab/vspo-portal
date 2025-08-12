import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type { Page } from "../domain/pagination";
import type { Streams } from "../domain/stream";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";

export type BatchUpsertStreamsParam = Streams;
export type BatchDeleteByStreamIdsParam = {
  streamIds: string[];
};
export type TranslateStreamParam = {
  languageCode: string;
  streams: Streams;
};
export type SearchByStreamIdsAndCreateParam = {
  streamIds: string[];
};
export type ListParam = {
  limit: number;
  page: number;
  platform?: string;
  memberType?: string;
  languageCode: string;
  status?: string;
  orderBy?: "asc" | "desc";
  channelIds?: string[];
};
export type ListResponse = {
  streams: Streams;
  pagination: Page;
};

export interface IStreamInteractor {
  batchUpsert(
    params: BatchUpsertStreamsParam,
  ): Promise<Result<Streams, AppError>>;
  batchDeleteByStreamIds(
    params: BatchDeleteByStreamIdsParam,
  ): Promise<Result<void, AppError>>;
  translateStream(
    params: TranslateStreamParam,
  ): Promise<Result<Streams, AppError>>;
  searchByStreamsIdsAndCreate(
    params: SearchByStreamIdsAndCreateParam,
  ): Promise<Result<Streams, AppError>>;
}

// Internal write functions
export async function batchUpsertStreams(
  context: IAppContext,
  params: BatchUpsertStreamsParam,
): Promise<Result<Streams, AppError>> {
  return await withTracerResult("batchUpsertStreams", "execute", async () => {
    return context.runInTx(async (repos, _services) => {
      const uv = await repos.streamRepository.batchUpsert(params);
      if (uv.err) {
        return uv;
      }
      return Ok(uv.val);
    });
  });
}

export async function batchDeleteStreamsByIds(
  context: IAppContext,
  params: BatchDeleteByStreamIdsParam,
): Promise<Result<void, AppError>> {
  return await withTracerResult(
    "batchDeleteStreamsByIds",
    "execute",
    async () => {
      return context.runInTx(async (repos, _services) => {
        const uv = await repos.streamRepository.batchDelete(params.streamIds);
        if (uv.err) {
          return uv;
        }
        return uv;
      });
    },
  );
}

export async function translateStreams(
  context: IAppContext,
  params: TranslateStreamParam,
): Promise<Result<Streams, AppError>> {
  return await withTracerResult("translateStreams", "execute", async () => {
    return context.runInTx(async (_repos, services) => {
      const sv = await services.streamService.translateStreams(params);
      if (sv.err) {
        return sv;
      }
      return Ok(sv.val);
    });
  });
}

export async function searchAndCreateStreamsByIds(
  context: IAppContext,
  params: SearchByStreamIdsAndCreateParam,
): Promise<Result<Streams, AppError>> {
  return await withTracerResult(
    "searchAndCreateStreamsByIds",
    "execute",
    async () => {
      return context.runInTx(async (repos, services) => {
        const vs = await services.streamService.getStreamsByStreamIds(params);
        if (vs.err) {
          return vs;
        }

        const upsertedStreams = await repos.streamRepository.batchUpsert(
          vs.val,
        );
        if (upsertedStreams.err) {
          return upsertedStreams;
        }

        return Ok(upsertedStreams.val);
      });
    },
  );
}

// Create interactor instance
export const createStreamInteractor = (
  context: IAppContext,
): IStreamInteractor => {
  // Write operations only
  const batchUpsert = async (
    params: BatchUpsertStreamsParam,
  ): Promise<Result<Streams, AppError>> => {
    return batchUpsertStreams(context, params);
  };

  const batchDeleteByStreamIds = async (
    params: BatchDeleteByStreamIdsParam,
  ): Promise<Result<void, AppError>> => {
    return batchDeleteStreamsByIds(context, params);
  };

  const translateStream = async (
    params: TranslateStreamParam,
  ): Promise<Result<Streams, AppError>> => {
    return translateStreams(context, params);
  };

  const searchByStreamsIdsAndCreate = async (
    params: SearchByStreamIdsAndCreateParam,
  ): Promise<Result<Streams, AppError>> => {
    return searchAndCreateStreamsByIds(context, params);
  };

  return {
    batchUpsert,
    batchDeleteByStreamIds,
    translateStream,
    searchByStreamsIdsAndCreate,
  };
};
