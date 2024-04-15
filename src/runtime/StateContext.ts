import { EaCRuntimeConfig, IoCContainer } from '../src.deps.ts';
import { StateFlowEaCContext } from './StateFlowEaCContext.ts';
import {
  StateFlowHandlerConfig,
  StateFlowRuntimeEaC,
  StateFlowStateHandlerConfig,
} from './StateFlowEaCRuntime.ts';

export type StateContext<TState = unknown> = StateFlowEaCContext & {
  Entity: <TEntity, TEntityActions>(
    entityPath: string,
  ) => [TEntity, TEntityActions];

  Runtime: {
    Config: EaCRuntimeConfig;

    EaC: StateFlowRuntimeEaC;

    HandlerConfig: StateFlowHandlerConfig;

    Info: Deno.ServeHandlerInfo;

    IoC: IoCContainer;

    Revision: number;

    StateHandlerConfig: StateFlowStateHandlerConfig;

    URLMatch: {
      Base: string;

      Hash?: string;

      Path: string;

      Search?: string;
    };
  };

  State: TState;
};
