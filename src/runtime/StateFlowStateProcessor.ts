import { StateContext } from './StateContext.ts';

export class StateFlowStateProcessor {
  constructor(protected socket: WebSocket) {}

  public Configure(ctx: StateContext): void {
    this.socket.addEventListener('open', () => {
      this.handleOpen(ctx);
    });
  }

  protected handleOpen(ctx: StateContext): void {
    this.socket.send(
      JSON.stringify({
        revision: ctx.Runtime.Revision,
        type: 'state-flow',
      }),
    );
  }
}
