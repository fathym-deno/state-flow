import { StateFlowEaCContext } from './StateFlowEaCContext.ts';

export type EntityContext<TEntity = unknown> = StateFlowEaCContext & {
  Entity: TEntity;
};
