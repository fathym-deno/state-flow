export type StateFlowAction = {
  Arguments: [string, unknown | undefined][];

  CorrelationID: string;

  Name: string;
};

export function isStateFlowAction(sf: unknown): sf is StateFlowAction {
  const action = sf as StateFlowAction;

  return (
    action &&
    action.Arguments !== undefined &&
    Array.isArray(action.Arguments) &&
    action.CorrelationID !== undefined &&
    typeof action.CorrelationID === 'string' &&
    action.Name !== undefined &&
    typeof action.Name === 'string'
  );
}
