import { type AppError, Ok, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { type Page, createPage } from "../domain/pagination";
import type { Streams } from "../domain/stream";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";

export type BatchUpsertStreamsParam = Streams;
export type BatchUpsertByIdsParam = {
  youtubeStreamIds: string[];
  twitchStreamIds: string[];
};
export type ListParam = {
  limit: number;
  page: number;
  platform?: string;
  status?: string;
  memberType?: string;
  creatorIds?: string[];
  startDateFrom?: Date;
  startDateTo?: Date;
  endedAt?: Date;
  languageCode: string;
  orderBy?: "asc" | "desc";
};

export type ListResponse = {
  streams: Streams;
  pagination: Page;
};

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

export interface IStreamInteractor {
  batchUpsert(
    params: BatchUpsertStreamsParam,
  ): Promise<Result<Streams, AppError>>;
  searchLive(): Promise<Result<Streams, AppError>>;
  searchExist(): Promise<Result<Streams, AppError>>;
  list(params: ListParam): Promise<Result<ListResponse, AppError>>;
  searchDeletedCheck(): Promise<Result<Streams, AppError>>;
  batchDeleteByStreamIds(
    params: BatchDeleteByStreamIdsParam,
  ): Promise<Result<void, AppError>>;
  translateStream(
    params: TranslateStreamParam,
  ): Promise<Result<Streams, AppError>>;
  getMemberStreams(): Promise<Result<Streams, AppError>>;
  deletedListIds(): Promise<Result<string[], AppError>>;
  searchByStreamsIdsAndCreate(
    params: SearchByStreamIdsAndCreateParam,
  ): Promise<Result<Streams, AppError>>;
}

export const createStreamInteractor = (
  context: IAppContext,
): IStreamInteractor => {
  const INTERACTOR_NAME = "StreamInteractor";

  // Fetch new streams from external APIs
  const searchLive = async (): Promise<Result<Streams, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "searchLive", async () => {
      return context.runInTx(async (_repos, services) => {
        const sv = await services.streamService.searchAllLiveStreams();
        if (sv.err) {
          return sv;
        }
        return Ok(sv.val);
      });
    });
  };

  // Fetch streams from database and external APIs
  const searchExist = async (): Promise<Result<Streams, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "searchExist", async () => {
      return context.runInTx(async (_repos, services) => {
        const sv = await services.streamService.searchExistStreams();
        if (sv.err) {
          return sv;
        }
        return Ok(sv.val);
      });
    });
  };

  const batchUpsert = async (
    params: BatchUpsertStreamsParam,
  ): Promise<Result<Streams, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "batchUpsert", async () => {
      return context.runInTx(async (repos, _services) => {
        const uv = await repos.streamRepository.batchUpsert(params);
        if (uv.err) {
          return uv;
        }
        return Ok(uv.val);
      });
    });
  };

  const list = async (
    params: ListParam,
  ): Promise<Result<ListResponse, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "list", async () => {
      return context.runInTx(async (repos, _services) => {
        const sv = await repos.streamRepository.list(params);
        if (sv.err) {
          return sv;
        }

        const c = await repos.streamRepository.count(params);
        if (c.err) {
          return c;
        }
        return Ok({
          streams: sv.val,
          pagination: createPage({
            currentPage: params.page,
            limit: params.limit,
            totalCount: c.val,
          }),
        });
      });
    });
  };

  const searchDeletedCheck = async (): Promise<Result<Streams, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "searchDeletedCheck",
      async () => {
        return context.runInTx(async (repos, services) => {
          const sv = await services.streamService.searchDeletedStreams();
          if (sv.err) {
            return sv;
          }

          return Ok(sv.val);
        });
      },
    );
  };

  const batchDeleteByStreamIds = async (
    params: BatchDeleteByStreamIdsParam,
  ): Promise<Result<void, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "batchDeleteByStreamIds",
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
  };

  const translateStream = async (
    params: TranslateStreamParam,
  ): Promise<Result<Streams, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "translateStream",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const sv = await services.streamService.translateStreams(params);
          if (sv.err) {
            return sv;
          }
          return Ok(sv.val);
        });
      },
    );
  };

  const getMemberStreams = async (): Promise<Result<Streams, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "getMemberStreams",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const sv = await services.streamService.getMemberStreams();
          if (sv.err) {
            return sv;
          }
          return Ok(sv.val);
        });
      },
    );
  };

  const deletedListIds = async (): Promise<Result<string[], AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "deletedListIds",
      async () => {
        return context.runInTx(async (repos, _services) => {
          const sv = await repos.streamRepository.deletedListIds();
          if (sv.err) {
            return sv;
          }
          AppLogger.debug("deletedListIds", {
            streamIds: sv.val,
          });
          return Ok(sv.val);
        });
      },
    );
  };

  const searchByStreamsIdsAndCreate = async (
    params: SearchByStreamIdsAndCreateParam,
  ): Promise<Result<Streams, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "searchByStreamsIdAndCreate",
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
  };

  return {
    batchUpsert,
    searchLive,
    searchExist,
    list,
    searchDeletedCheck,
    batchDeleteByStreamIds,
    translateStream,
    getMemberStreams,
    deletedListIds,
    searchByStreamsIdsAndCreate,
  };
};
