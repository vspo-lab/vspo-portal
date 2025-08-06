import type { IAppContext } from "../../../../../infra/dependency";
import type { ICommandService, IQueryService } from "../base";
import {
  batchDeleteStreamsByIdsCommand,
  batchUpsertStreamsCommand,
  searchAndCreateStreamsByIdsCommand,
  translateStreamsCommand,
} from "./commands";
import {
  getDeletedStreamIdsQuery,
  getMemberStreamsQuery,
  listStreamsQuery,
  searchDeletedStreamsQuery,
  searchExistStreamsQuery,
  searchLiveStreamsQuery,
} from "./queries";

export class StreamQueryService implements IQueryService {
  constructor(public readonly context: IAppContext) {}

  searchLive() {
    return searchLiveStreamsQuery(this.context, undefined);
  }

  searchExist() {
    return searchExistStreamsQuery(this.context, undefined);
  }

  list(params: Parameters<typeof listStreamsQuery>[1]) {
    return listStreamsQuery(this.context, params);
  }

  getMemberStreams() {
    return getMemberStreamsQuery(this.context, undefined);
  }

  getDeletedStreamIds() {
    return getDeletedStreamIdsQuery(this.context, undefined);
  }

  searchDeleted() {
    return searchDeletedStreamsQuery(this.context, undefined);
  }
}

export class StreamCommandService implements ICommandService {
  constructor(public readonly context: IAppContext) {}

  batchUpsert(params: Parameters<typeof batchUpsertStreamsCommand>[1]) {
    return batchUpsertStreamsCommand(this.context, params);
  }

  batchDeleteByIds(
    params: Parameters<typeof batchDeleteStreamsByIdsCommand>[1],
  ) {
    return batchDeleteStreamsByIdsCommand(this.context, params);
  }

  translate(params: Parameters<typeof translateStreamsCommand>[1]) {
    return translateStreamsCommand(this.context, params);
  }

  searchAndCreateByIds(
    params: Parameters<typeof searchAndCreateStreamsByIdsCommand>[1],
  ) {
    return searchAndCreateStreamsByIdsCommand(this.context, params);
  }
}
