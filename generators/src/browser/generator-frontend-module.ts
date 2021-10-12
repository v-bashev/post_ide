import { ContainerModule } from 'inversify';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging/ws-connection-provider' ;
import { IGeneratorServer, generatorServicePath } from '../common/generator-protocol';
import { GenerateCommandContribution, GenerateMenuContribution, GeneratorClient } from './generator-client';
import { CommandContribution, MenuContribution } from '@theia/core';
import { GeneratorFrontendService } from './generator-frontend-service';

export default new ContainerModule(bind => {
    bind(GeneratorFrontendService).toSelf().inSingletonScope();
    
    bind(CommandContribution).to(GenerateCommandContribution);
    bind(MenuContribution).to(GenerateMenuContribution);

    bind(GeneratorClient).toSelf().inSingletonScope();
    bind(IGeneratorServer).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        const client = ctx.container.get(GeneratorClient);
        return connection.createProxy<IGeneratorServer>(generatorServicePath, client);
    }).inSingletonScope();
});