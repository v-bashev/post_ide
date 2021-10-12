import { injectable, inject } from "inversify";
import { MenuContribution, MenuModelRegistry, CommandContribution, CommandRegistry, SelectionService, MessageService } from "@theia/core/lib/common";
import { UriAwareCommandHandler, UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { CommonMenus } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { GeneratorFrontendService } from "./generator-frontend-service";
import { IGeneratorClient } from "../common/generator-protocol";

export const GenerateCommand = {
    id: 'Generate.command',
    label: "Generates something"
};

@injectable()
export class GenerateMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: GenerateCommand.id,
            label: 'Generate'
        });
    }
}

@injectable()
export class GenerateCommandContribution implements CommandContribution {
    constructor(
        @inject(SelectionService) private readonly selectionService: SelectionService,
        @inject(GeneratorFrontendService) private readonly generatorService: GeneratorFrontendService
    ) {}

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(GenerateCommand, this.newUriAwareCommandHandler({
            execute: (uri: URI) => this.generatorService.generate(uri),
            isVisible: (uri: URI) => uri.toString().endsWith('post'),
            isEnabled: (uri: URI) => uri.toString().endsWith("post")
        }));
        // registry.registerCommand(GenerateCommand, {
        //     execute: async () => {
        //         const generationResult = await this.generatorService.generate();
        //         this.messageService.info("Generated " + generationResult);
        //         // this.messageService.info("Generated " + this.workspaceService.workspace?.uri);
        //     }
        // });
    }

    protected newUriAwareCommandHandler(handler: UriCommandHandler<URI>): UriAwareCommandHandler<URI> {
        return new UriAwareCommandHandler(this.selectionService, handler);
    }
}

@injectable()
export class GeneratorClient implements IGeneratorClient {
constructor(@inject(MessageService) protected readonly messageService: MessageService) {}

    onGenerationStatusUpdated(status: string): void {
        this.messageService.info(status);
    }
}