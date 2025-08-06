import type { AppError, Result } from "@vspo-lab/error";
import type { Streams } from "../../../../../domain/stream";
import type { IAppContext } from "../../../../../infra/dependency";
import type {
  BatchDeleteByStreamIdsParam,
  BatchUpsertStreamsParam,
  IStreamInteractor,
  ListParam,
  ListResponse,
  SearchByStreamIdsAndCreateParam,
  TranslateStreamParam,
} from "../../../../../usecase/stream";
import { StreamCommandService, StreamQueryService } from "./service";

/**
 * Adapter to maintain compatibility with existing IStreamInteractor interface
 * while using the new CQRS pattern internally
 */
export class StreamInteractorCQRSAdapter implements IStreamInteractor {
  private readonly queryService: StreamQueryService;
  private readonly commandService: StreamCommandService;

  constructor(context: IAppContext) {
    this.queryService = new StreamQueryService(context);
    this.commandService = new StreamCommandService(context);
  }

  async searchLive(): Promise<Result<Streams, AppError>> {
    return this.queryService.searchLive();
  }

  async searchExist(): Promise<Result<Streams, AppError>> {
    return this.queryService.searchExist();
  }

  async batchUpsert(
    params: BatchUpsertStreamsParam,
  ): Promise<Result<Streams, AppError>> {
    return this.commandService.batchUpsert(params);
  }

  async list(params: ListParam): Promise<Result<ListResponse, AppError>> {
    return this.queryService.list(params);
  }

  async searchDeletedCheck(): Promise<Result<Streams, AppError>> {
    return this.queryService.searchDeleted();
  }

  async batchDeleteByStreamIds(
    params: BatchDeleteByStreamIdsParam,
  ): Promise<Result<void, AppError>> {
    return this.commandService.batchDeleteByIds(params);
  }

  async translateStream(
    params: TranslateStreamParam,
  ): Promise<Result<Streams, AppError>> {
    return this.commandService.translate(params);
  }

  async getMemberStreams(): Promise<Result<Streams, AppError>> {
    return this.queryService.getMemberStreams();
  }

  async deletedListIds(): Promise<Result<string[], AppError>> {
    return this.queryService.getDeletedStreamIds();
  }

  async searchByStreamsIdsAndCreate(
    params: SearchByStreamIdsAndCreateParam,
  ): Promise<Result<Streams, AppError>> {
    return this.commandService.searchAndCreateByIds(params);
  }
}
