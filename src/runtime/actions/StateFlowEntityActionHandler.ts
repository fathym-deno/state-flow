// deno-lint-ignore-file no-explicit-any
import { EntityContext } from '../EntityContext.ts';
import {
  StateFlowActionHandler,
  StateFlowActionHandlerResult,
  StateFlowActionHandlers,
} from './StateFlowActionHandler.ts';

export type StateFlowEntityActionHandler<
  TEntity = unknown,
  TResult extends unknown | void = unknown,
  TParams extends any[] = any[],
> = StateFlowActionHandler<EntityContext<TEntity>, TEntity, TResult, TParams>;

export type StateFlowEntityActionHandlers<
  TEntity = unknown,
  TMethods = Record<string | number | symbol, never>,
> = StateFlowActionHandlers<EntityContext<TEntity>, TEntity, TMethods> & {
  $init?: StateFlowEntityActionHandler<TEntity>;
};

export type StateFlowEntityActionHandlerResult<TEntity = unknown> = StateFlowActionHandlerResult<
  EntityContext<TEntity>,
  TEntity
>;
