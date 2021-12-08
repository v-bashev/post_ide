import { inject, injectable } from "inversify";
import { Command, CommandRegistry, MenuContribution, MenuModelRegistry, SelectionService } from "@theia/core/lib/common";
import { IDSMWrapperServer } from "../common/dsm-wrapper-protocols";
import { UriAwareCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import URI from "@theia/core/lib/common/uri";
import { DSMDialog } from "./dsm-dialog";
import { DSMParameter, DSMParameterType } from "./dsm-parameter";

@injectable()
export class DSMMenuContribution implements MenuContribution {
    @inject(CommandRegistry)
    private commands: CommandRegistry;

    @inject(IDSMWrapperServer)
    private dsmWrapperServer: IDSMWrapperServer;

    @inject(SelectionService)
    private selectionService: SelectionService;

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        const menuPath = ["navigator-context-menu", "dynamic-sub-menu"];
        const configs = await this.dsmWrapperServer.scanDSMs();

        // register sub menu to show our DSM menu actions
        menus.registerSubmenu(menuPath, "DSM");

        configs.forEach(config => {
            // TODO: Handle parameters' dictionary
            const command: Command = {
                id: config.id,
                label: config.name
            }
            let dsmParameters: DSMParameter[] = Object.entries(config.parameters).map(key => {
                let type: DSMParameterType
                let jsonType: string = key[1];
                if (jsonType == DSMParameterType.String) {
                    type = DSMParameterType.String;
                } else if (jsonType == DSMParameterType.Boolean) {
                    type = DSMParameterType.Boolean
                } else if (jsonType == DSMParameterType.Number) {
                    type = DSMParameterType.Number
                } else {
                    return null;
                }
                return new DSMParameter(key[0], type);
            })
                .filter(entry => entry !== null && entry !== undefined)
                .map(entry => entry!)
            let cmdHandler = new UriAwareCommandHandler<URI[]>(this.selectionService, {
                execute: (uri: URI[]) => {
                    let dialog = new DSMDialog(dsmParameters);
                    dialog.open()
                        .then(parameterValues => this.dsmWrapperServer.runDSM(command.id, uri.map(uri => uri.toString()), parameterValues),)
                },
                isEnabled: (uri: URI[]) => uri.every((value => value.toString().endsWith('post'))),
                isVisible: (uri: URI[]) => uri.every((value => value.toString().endsWith('post')))
            }, { multi: true });
            this.commands.registerCommand(command, cmdHandler);
            menus.registerMenuAction(menuPath, { commandId: command.id });
        });
    }
}