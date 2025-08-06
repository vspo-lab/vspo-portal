import type { AppError, Result } from "@vspo-lab/error";
import type { IAppContext } from "../../../../infra/dependency";

// Query and Command type definitions
export type Query<TParams, TResult> = (
  context: IAppContext,
  params: TParams,
) => Promise<Result<TResult, AppError>>;

export type Command<TParams, TResult = void> = (
  context: IAppContext,
  params: TParams,
) => Promise<Result<TResult, AppError>>;

// Service types for organizing commands and queries
export interface IQueryService {
  readonly context: IAppContext;
}

export interface ICommandService {
  readonly context: IAppContext;
}
