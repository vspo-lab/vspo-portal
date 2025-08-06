import { Ok } from "@vspo-lab/error";
import { createPage, type Page } from "../../domain/pagination";
import type { Streams } from "../../domain/stream";
import type { IAppContext } from "../../infra/dependency";
import { withTracerResult } from "../../infra/http/trace";

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

export type GetDeletedStreamIdsParam = {
  creatorIds: string[];
};

export async function searchLiveStreams(
  context: IAppContext,
): Promise<ReturnType<typeof context.runInTx<Streams>>> {
  return await withTracerResult("searchLiveStreams", "execute", async () => {
    return context.runInTx(async (_repos, services) => {
      const sv = await services.streamService.searchAllLiveStreams();
      if (sv.err) {
        return sv;
      }
      return Ok(sv.val);
    });
  });
}

export async function searchExistStreams(
  context: IAppContext,
): Promise<ReturnType<typeof context.runInTx<Streams>>> {
  return await withTracerResult("searchExistStreams", "execute", async () => {
    return context.runInTx(async (_repos, services) => {
      const sv = await services.streamService.searchExistStreams();
      if (sv.err) {
        return sv;
      }
      return Ok(sv.val);
    });
  });
}

export type StreamsPage = {
  streams: Streams;
  pagination: Page;
};

export async function listStreams(
  context: IAppContext,
  params: ListParam,
): Promise<ReturnType<typeof context.runInTx<StreamsPage>>> {
  return await withTracerResult("listStreams", "execute", async () => {
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
}

export async function getMemberStreams(
  context: IAppContext,
): Promise<ReturnType<typeof context.runInTx<Streams>>> {
  return await withTracerResult("getMemberStreams", "execute", async () => {
    return context.runInTx(async (_repos, services) => {
      const sv = await services.streamService.getMemberStreams();
      if (sv.err) {
        return sv;
      }
      return Ok(sv.val);
    });
  });
}

export async function getDeletedStreamIds(
  context: IAppContext,
  _params?: GetDeletedStreamIdsParam,
): Promise<ReturnType<typeof context.runInTx<string[]>>> {
  return await withTracerResult("getDeletedStreamIds", "execute", async () => {
    return context.runInTx(async (repos, _services) => {
      const ids = await repos.streamRepository.deletedListIds();
      if (ids.err) {
        return ids;
      }
      return Ok(ids.val);
    });
  });
}

export async function searchDeletedStreams(
  context: IAppContext,
): Promise<ReturnType<typeof context.runInTx<Streams>>> {
  return await withTracerResult("searchDeletedStreams", "execute", async () => {
    return context.runInTx(async (_repos, services) => {
      const sv = await services.streamService.searchDeletedStreams();
      if (sv.err) {
        return sv;
      }
      return Ok(sv.val);
    });
  });
}
