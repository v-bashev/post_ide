import { ContainerModule } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core/lib/common/messaging";
import { IGeneratorClient, generatorServicePath } from '../common/generator-protocol';
import { GeneratorServer } from '../node/generator-server';
import { BackendApplicationContribution } from '@theia/core/lib/node';

export default new ContainerModule(bind => {
    bind(GeneratorServer).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(GeneratorServer);

    bind(ConnectionHandler).toDynamicValue(ctx => 
        new JsonRpcConnectionHandler<IGeneratorClient>(generatorServicePath, client => {
            const generatorServer = ctx.container.get<GeneratorServer>(GeneratorServer);
            generatorServer.setClient(client);
            return generatorServer;
        })
    ).inSingletonScope();
});
