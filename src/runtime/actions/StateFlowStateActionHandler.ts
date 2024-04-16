// deno-lint-ignore-file no-explicit-any
import { StateContext } from '../StateContext.ts';
import { StateFlowActionHandler, StateFlowActionHandlers } from './StateFlowActionHandler.ts';

export type StateFlowStateActionHandler<
  TState = unknown,
  TResult extends unknown | void = unknown,
  TParams extends any[] = any[],
> = StateFlowActionHandler<StateContext<TState>, TState, TResult, TParams>;

export type StateFlowStateActionHandlers<
  TState = unknown,
  TMethods = Record<string | number | symbol, never>,
> = StateFlowActionHandlers<StateContext<TState>, TState, TMethods> & {
  $init?: StateFlowStateActionHandler<TState>;
};

// export type StateFlowStateActionHandlerResult<TState = unknown> = StateFlowActionHandlerResult<
//   StateContext<TState>,
//   TState
// >;
