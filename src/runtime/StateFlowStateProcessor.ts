import { StateContext } from './StateContext.ts';
import { isStateFlowAction } from './actions/StateFlowAction.ts';
import { StateFlowAction } from './actions/StateFlowAction.ts';

export class StateFlowStateProcessor<TState = unknown> {
  constructor(protected socket: WebSocket) {}

  public Configure(ctx: StateContext<TState>): void {
    this.socket.addEventListener('open', () => {
      this.handleOpen(ctx);
    });

    this.socket.addEventListener('message', (event: MessageEvent) => {
      if (isStateFlowAction(event.data)) {
        this.handleAction(ctx, event).then();
      }
    });
  }

  public Invoke(action: StateFlowAction): void {
    this.socket.send(JSON.stringify(action));
  }

  // public RPC<TResult>(): TResult {
  //   this.socket
  // }

  protected async handleAction(
    ctx: StateContext<TState>,
    event: MessageEvent<StateFlowAction>,
  ): Promise<void> {
    ctx.Action = event.data;

    if (ctx.Action.Name in ctx.Runtime.StateHandlerConfig.Actions) {
      const action = ctx.Runtime.StateHandlerConfig.Actions[ctx.Action.Name]!;

      const args = ctx.Action.Arguments.map(([_argName, val]) => val);

      const result = await action(ctx, ...args);

      if (result) {
        // Correlate result if it exists
      }
    }
  }

  protected handleOpen(ctx: StateContext<TState>): void {
    this.socket.send(
      JSON.stringify({
        revision: ctx.Runtime.Revision,
        type: 'state-flow',
      }),
    );
  }
}
