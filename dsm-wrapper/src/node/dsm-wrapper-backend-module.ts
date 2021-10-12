import { ContainerModule } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core/lib/common/messaging";
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { DSMWrapperServer } from "./dsm-wrapper-server";
import { dsmWrapperServicePath, IDSMWrapperClient } from "../common/dsm-wrapper-protocols";

export default new ContainerModule(bind => {
    bind(DSMWrapperServer).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(DSMWrapperServer);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler<IDSMWrapperClient>(dsmWrapperServicePath, client => {
            const dsmWrapperServer = ctx.container.get<DSMWrapperServer>(DSMWrapperServer);
            dsmWrapperServer.setClient(client);
            return dsmWrapperServer;
        })
    ).inSingletonScope();
});
