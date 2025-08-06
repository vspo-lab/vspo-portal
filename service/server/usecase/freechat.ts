import type { Freechats } from "../domain/freechat";
import type { Page } from "../domain/pagination";
import type { IAppContext } from "../infra/dependency";

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

export type IFreechatInteractor = {};

export const createFreechatInteractor = (
  _context: IAppContext,
): IFreechatInteractor => {
  const _INTERACTOR_NAME = "FreechatInteractor";

  // No write operations for freechat
  return {};
};
