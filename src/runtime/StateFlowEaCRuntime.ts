import {
  convertFilePathToPattern,
  EaCRuntime,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EaCStateAsCode,
  EverythingAsCode,
  EverythingAsCodeDatabases,
  EverythingAsCodeStates,
  importDFSTypescriptModule,
  IoCContainer,
  loadFileHandler,
  mergeWithArrays,
} from '../src.deps.ts';
import { StateContext } from './StateContext.ts';
import { StateFlowStateProcessor } from './StateFlowStateProcessor.ts';
import { StateFlowStateActionHandlers } from './actions/StateFlowStateActionHandler.ts';

export type StateFlowEaCRuntimeHandler<TState = unknown> = (
  request: Request,
  ctx: StateContext<TState>,
) => Response | Promise<Response>;

export type StateFlowHandlerConfig = {
  Handler: StateFlowEaCRuntimeHandler;

  Patterns: URLPattern[];

  State: EaCStateAsCode;

  StateLookup: string;
};

export type StateFlowStateHandlerConfig = {
  Actions: StateFlowStateActionHandlers;

  Pattern: URLPattern;

  Priority: number;

  // deno-lint-ignore no-explicit-any
  State: any;
};

export type StateFlowRuntimeEaC =
  & EverythingAsCode
  & EverythingAsCodeDatabases
  & EverythingAsCodeStates;

export class StateFlowEaCRuntime implements EaCRuntime {
  protected pluginConfigs: Map<
    EaCRuntimePlugin | [string, ...args: unknown[]],
    EaCRuntimePluginConfig | undefined
  >;

  protected pluginDefs: Map<
    EaCRuntimePlugin | [string, ...args: unknown[]],
    EaCRuntimePlugin
  >;

  protected stateGraph?: StateFlowHandlerConfig[];

  public EaC?: StateFlowRuntimeEaC;

  public IoC: IoCContainer;

  public Revision: number;

  constructor(protected config: EaCRuntimeConfig) {
    this.pluginConfigs = new Map();

    this.pluginDefs = new Map();

    this.IoC = new IoCContainer();

    this.Revision = Date.now();
  }

  public async Configure(
    configure?: (rt: EaCRuntime) => Promise<void>,
  ): Promise<void> {
    this.pluginConfigs = new Map();

    this.pluginDefs = new Map();

    this.EaC = this.config.EaC;

    this.IoC = this.config.IoC || new IoCContainer();

    await this.configurePlugins(this.config.Plugins);

    if (!this.EaC) {
      throw new Error(
        'An EaC must be provided in the config or via a connection to an EaC Service with the EAC_API_KEY environment variable.',
      );
    }

    if (!this.EaC!.States) {
      throw new Error(
        'The EaC must provide a set of projects to use in the runtime.',
      );
    }

    await this.afterEaCResolved();

    this.Revision = Date.now();

    if (configure) {
      configure(this);
    }

    await Promise.all([this.buildStateGraph(), this.buildEntityGraph()]);
  }

  public Handle(
    request: Request,
    info: Deno.ServeHandlerInfo,
  ): Response | Promise<Response> {
    const handlerConfig = this.stateGraph!.find((node) => {
      return node.Patterns.some((pattern) => pattern.test(request.url));
    });

    if (!handlerConfig) {
      throw new Error(`No state is configured for '${request.url}'.`);
    }

    const resp = handlerConfig.Handler(request, {
      Runtime: {
        Config: this.config,
        EaC: this.EaC,
        Info: info,
        IoC: this.IoC,
        Revision: this.Revision,
        HandlerConfig: handlerConfig,
      },
      // Action: ,
      // Entity: ,
      // Params: ,
      // State: {},
    } as StateContext);

    return resp;
  }

  protected async afterEaCResolved(): Promise<void> {
    for (const pluginDef of this.pluginDefs.values() || []) {
      if (pluginDef.AfterEaCResolved) {
        await pluginDef.AfterEaCResolved(this.EaC!, this.IoC);
      }
    }
  }

  protected async buildEntityGraph() {}

  protected async buildStateGraph() {
    if (this.EaC!.States) {
      const stateLookups = Object.keys(this.EaC?.States || {});

      const stateGraphCalls = stateLookups
        .map((stateLookup) => {
          const state = this.EaC!.States![stateLookup];

          const resolverKeys = Object.keys(state.ResolverConfigs);

          return {
            State: state,
            StateLookup: stateLookup,
            Patterns: resolverKeys.map((lk) => {
              const resolverCfg = state.ResolverConfigs[lk];

              return new URLPattern({
                hostname: resolverCfg.Hostname,
                port: resolverCfg.Port?.toString(),
                pathname: resolverCfg.Path,
              });
            }),
          } as StateFlowHandlerConfig;
        })
        .map(async (stHndlrCfg) => {
          const dfs = this.EaC!.DFS![stHndlrCfg.State.Details!.DFSLookup];

          const dfsFileHandler = await loadFileHandler(this.IoC, dfs);

          const allFiles = await dfsFileHandler?.LoadAllPaths(this.Revision);

          const fileImportCalls = allFiles?.map(async (filePath) => {
            return {
              filePath,
              module: await importDFSTypescriptModule(
                undefined,
                dfsFileHandler!,
                filePath,
                dfs,
                'ts',
              ),
            };
          }) || [];

          const fileImports = await Promise.all(fileImportCalls);

          const lookupGraph = fileImports
            .filter((fi) => fi)
            .map((fi) => fi!)
            .map(({ filePath, module }) => {
              const { patternText, priority } = convertFilePathToPattern(
                filePath,
                dfs,
              );

              return {
                Pattern: new URLPattern({
                  pathname: patternText,
                }),
                Priority: priority,
                Actions: module?.module.Actions,
                State: module?.module.default,
              } as StateFlowStateHandlerConfig;
            });

          // Build handler lookup graph with imported state and actions

          return {
            ...stHndlrCfg,
            Handler: await this.establishStateHandler(lookupGraph),
          };
        });

      this.stateGraph = (await Promise.all(stateGraphCalls)).sort((a, b) => {
        return b.State.Details!.Priority - a.State.Details!.Priority;
      });
    }
  }

  protected async configurePlugins(
    plugins?: (EaCRuntimePlugin | [string, ...args: unknown[]])[],
  ): Promise<void> {
    for (let pluginDef of plugins || []) {
      const pluginKey = pluginDef;

      if (Array.isArray(pluginDef)) {
        const [plugin, ...args] = pluginDef;

        pluginDef = new (await import(plugin)).default(
          args,
        ) as EaCRuntimePlugin;
      }

      this.pluginDefs.set(pluginKey, pluginDef);

      const pluginConfig = this.pluginConfigs.has(pluginKey)
        ? this.pluginConfigs.get(pluginKey)
        : pluginDef.Build
        ? await pluginDef.Build(this.config)
        : undefined;

      this.pluginConfigs.set(pluginKey, pluginConfig);

      if (pluginConfig) {
        if (pluginConfig.EaC) {
          this.EaC = mergeWithArrays(this.EaC || {}, pluginConfig.EaC);
        }

        if (pluginConfig.IoC) {
          pluginConfig.IoC.CopyTo(this.IoC!);
        }

        // if (pluginConfig.ModifierResolvers) {
        //   this.ModifierResolvers = merge(
        //     this.ModifierResolvers || {},
        //     pluginConfig.ModifierResolvers
        //   );
        // }

        await this.configurePlugins(pluginConfig.Plugins);
      }
    }
  }

  protected establishStateHandler(
    lookupGraph: StateFlowStateHandlerConfig[],
  ): StateFlowEaCRuntimeHandler {
    return (req, ctx) => {
      const stateHandlerConfig = lookupGraph.find((lg) =>
        lg.Pattern.test({ pathname: ctx.Runtime.URLMatch.Path })
      );

      if (stateHandlerConfig && req.headers.get('upgrade') === 'websocket') {
        ctx.Runtime.StateHandlerConfig = stateHandlerConfig;

        const { response, socket } = Deno.upgradeWebSocket(req);

        const processor = new StateFlowStateProcessor(socket);

        processor.Configure(ctx);

        return response;
      }

      throw new Error('Not yet implemented');
    };
  }
}
