import {
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  FathymDFSFileHandlerPlugin,
  FathymEaCPlugin,
  FathymEaCServicesPlugin,
  IoCContainer,
} from '../src.deps.ts';

export default class StateFlowCorePlugin implements EaCRuntimePlugin {
  public Build(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'StateFlowCorePlugin',
      IoC: new IoCContainer(),
      Plugins: [
        new FathymDFSFileHandlerPlugin(),
        new FathymEaCPlugin(),
        new FathymEaCServicesPlugin(),
      ],
    };

    // pluginConfig.IoC!.Register(PreactRenderHandler, () => {
    //   return new PreactRenderHandler(preactOptions);
    // });

    return Promise.resolve(pluginConfig);
  }
}
