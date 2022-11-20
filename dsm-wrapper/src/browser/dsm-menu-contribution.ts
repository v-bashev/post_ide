import { inject, injectable } from "inversify";
import { Command, CommandRegistry, MenuContribution, MenuModelRegistry, SelectionService } from "@theia/core/lib/common";
import { IDSMWrapperServer } from "../common/dsm-wrapper-protocols";
import { UriAwareCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import URI from "@theia/core/lib/common/uri";

@injectable()
export class DSMMenuContribution implements MenuContribution {
    @inject(CommandRegistry)
    private commands: CommandRegistry;

    @inject(IDSMWrapperServer)
    private dsmWrapperServer: IDSMWrapperServer;

    @inject(SelectionService)
    private selectionService: SelectionService;

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        const menuPath = ["navigator-context-menu", "dynamic-sub-menu", "dsm-sub-group"];

        // register sub menu to show our DSM menu actions
        menus.registerSubmenu(menuPath, "DSM");

        const configs = await this.dsmWrapperServer.scanDSMs();
        configs.forEach(config => {
            const command: Command = {
                id: config,
                label: config
            }
            let cmdHandler = new UriAwareCommandHandler<URI[]>(this.selectionService, {
                execute: (uri: URI[]) => {
                    this.dsmWrapperServer.runDSM(command.id, uri.map(uri => uri.toString()))
                },
                isEnabled: (uri: URI[]) => uri.every((value => value.toString().endsWith('post'))),
                isVisible: (uri: URI[]) => uri.every((value => value.toString().endsWith('post')))
            }, { multi: true });
            this.commands.registerCommand(command, cmdHandler);
            menus.registerMenuAction(menuPath, { commandId: command.id });
        });
    }
}