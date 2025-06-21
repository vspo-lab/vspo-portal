import { type AppError, Ok, type Result } from "@vspo-lab/error";
import { type Streams, createStreams } from "../../domain/stream";
import { withTracerResult } from "../http/trace/cloudflare";

type GetStreamsParams = {
  channelIds?: string[];
};

export interface IBilibiliService {
  getStreams(params: GetStreamsParams): Promise<Result<Streams, AppError>>;
}

export const createBilibiliService = (): IBilibiliService => {
  const getStreams = async (
    params: GetStreamsParams,
  ): Promise<Result<Streams, AppError>> => {
    return withTracerResult("BilibiliService", "getStreams", async (span) => {
      return Ok(createStreams([]));
    });
  };

  return {
    getStreams,
  };
};
