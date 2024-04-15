import { StateFlowAction } from './actions/StateFlowAction.ts';

export type StateFlowEaCContext = {
  Action: StateFlowAction;

  Params: Record<string, string | undefined>;
};
