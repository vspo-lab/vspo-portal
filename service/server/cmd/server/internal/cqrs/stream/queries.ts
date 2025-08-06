import { Ok } from "@vspo-lab/error";
import { createPage } from "../../../../../domain/pagination";
import type { Streams } from "../../../../../domain/stream";
import type { IAppContext } from "../../../../../infra/dependency";
import { withTracerResult } from "../../../../../infra/http/trace";
import type { ListParam, ListResponse } from "../../../../../usecase/stream";
import type { Query } from "../base";

export const searchLiveStreamsQuery: Query<undefined, Streams> = async (
  context: IAppContext,
  _params: undefined,
) => {
  return await withTracerResult(
    "searchLiveStreamsQuery",
    "execute",
    async () => {
      return context.runInTx(async (_repos, services) => {
        const sv = await services.streamService.searchAllLiveStreams();
        if (sv.err) {
          return sv;
        }
        return Ok(sv.val);
      });
    },
  );
};

export const searchExistStreamsQuery: Query<undefined, Streams> = async (
  context: IAppContext,
  _params: undefined,
) => {
  return await withTracerResult(
    "searchExistStreamsQuery",
    "execute",
    async () => {
      return context.runInTx(async (_repos, services) => {
        const sv = await services.streamService.searchExistStreams();
        if (sv.err) {
          return sv;
        }
        return Ok(sv.val);
      });
    },
  );
};

export const listStreamsQuery: Query<ListParam, ListResponse> = async (
  context: IAppContext,
  params: ListParam,
) => {
  return await withTracerResult("listStreamsQuery", "execute", async () => {
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

export const getMemberStreamsQuery: Query<undefined, Streams> = async (
  context: IAppContext,
  _params: undefined,
) => {
  return await withTracerResult(
    "getMemberStreamsQuery",
    "execute",
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

export const getDeletedStreamIdsQuery: Query<undefined, string[]> = async (
  context: IAppContext,
  _params: undefined,
) => {
  return await withTracerResult(
    "getDeletedStreamIdsQuery",
    "execute",
    async () => {
      return context.runInTx(async (repos, _services) => {
        const sv = await repos.streamRepository.deletedListIds();
        if (sv.err) {
          return sv;
        }
        return Ok(sv.val);
      });
    },
  );
};

export const searchDeletedStreamsQuery: Query<undefined, Streams> = async (
  context: IAppContext,
  _params: undefined,
) => {
  return await withTracerResult(
    "searchDeletedStreamsQuery",
    "execute",
    async () => {
      return context.runInTx(async (_repos, services) => {
        const sv = await services.streamService.searchDeletedStreams();
        if (sv.err) {
          return sv;
        }
        return Ok(sv.val);
      });
    },
  );
};
