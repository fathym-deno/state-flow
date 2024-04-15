// deno-lint-ignore-file no-explicit-any
import { StateContext } from '../StateContext.ts';
import { EntityContext } from '../EntityContext.ts';

export type StateFlowActionHandler<
  TContext extends EntityContext<TEntity> | StateContext<TEntity>,
  TEntity = unknown,
  TResult extends unknown | void = unknown,
  TParams extends any[] = any[],
> = (ctx: TContext, ...params: TParams) => TResult | Promise<TResult>;

export type StateFlowActionHandlers<
  TContext extends EntityContext<TEntity> | StateContext<TEntity>,
  TEntity = unknown,
  TMethods = Record<string | number | symbol, never>,
> = {
  [Property in keyof TMethods]:
    | StateFlowActionHandler<TContext, TEntity>
    | undefined;
};

export type StateFlowActionHandlerResult<
  TContext extends EntityContext<TEntity> | StateContext<TEntity>,
  TEntity = unknown,
> =
  | StateFlowActionHandler<TContext, TEntity>
  | StateFlowActionHandlers<TContext, TEntity>
  | (
    | StateFlowActionHandler<TContext, TEntity>
    | StateFlowActionHandlers<TContext, TEntity>
  )[];
