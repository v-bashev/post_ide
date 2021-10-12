import { ContainerModule } from "inversify";
import { DSMWrapperClient } from "./dsm-wrapper-client";
import { dsmWrapperServicePath, IDSMWrapperServer } from "../common/dsm-wrapper-protocols";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { MenuContribution } from "@theia/core";
import { DSMMenuContribution } from "./dsm-menu-contribution";

export default new ContainerModule(bind => {
    bind(MenuContribution).to(DSMMenuContribution).inSingletonScope();

    bind(DSMWrapperClient).toSelf().inSingletonScope()
    bind(IDSMWrapperServer).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        const client = ctx.container.get(DSMWrapperClient);
        return connection.createProxy<IDSMWrapperServer>(dsmWrapperServicePath, client);
    }).inSingletonScope();
});
