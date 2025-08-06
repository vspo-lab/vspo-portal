import { Ok } from "@vspo-lab/error";
import type { Streams } from "../../../../../domain/stream";
import type { IAppContext } from "../../../../../infra/dependency";
import { withTracerResult } from "../../../../../infra/http/trace";
import type {
  BatchDeleteByStreamIdsParam,
  BatchUpsertStreamsParam,
  SearchByStreamIdsAndCreateParam,
  TranslateStreamParam,
} from "../../../../../usecase/stream";
import type { Command } from "../base";

export const batchUpsertStreamsCommand: Command<
  BatchUpsertStreamsParam,
  Streams
> = async (context: IAppContext, params: BatchUpsertStreamsParam) => {
  return await withTracerResult(
    "batchUpsertStreamsCommand",
    "execute",
    async () => {
      return context.runInTx(async (repos, _services) => {
        const uv = await repos.streamRepository.batchUpsert(params);
        if (uv.err) {
          return uv;
        }
        return Ok(uv.val);
      });
    },
  );
};

export const batchDeleteStreamsByIdsCommand: Command<
  BatchDeleteByStreamIdsParam
> = async (context: IAppContext, params: BatchDeleteByStreamIdsParam) => {
  return await withTracerResult(
    "batchDeleteStreamsByIdsCommand",
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
};

export const translateStreamsCommand: Command<
  TranslateStreamParam,
  Streams
> = async (context: IAppContext, params: TranslateStreamParam) => {
  return await withTracerResult(
    "translateStreamsCommand",
    "execute",
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

export const searchAndCreateStreamsByIdsCommand: Command<
  SearchByStreamIdsAndCreateParam,
  Streams
> = async (context: IAppContext, params: SearchByStreamIdsAndCreateParam) => {
  return await withTracerResult(
    "searchAndCreateStreamsByIdsCommand",
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
};
