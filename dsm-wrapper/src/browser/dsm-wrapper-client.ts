import { inject, injectable } from "inversify";
import { IDSMWrapperClient } from "../common/dsm-wrapper-protocols";
import { MessageService } from "@theia/core";

@injectable()
export class DSMWrapperClient implements IDSMWrapperClient {
    constructor(
        @inject(MessageService) private readonly messageService: MessageService
    ) { }

    onDSMLaunched(dsmName: string): void {
        this.messageService.info(dsmName + " has been launched");
    }

    onFailedToLaunchDSM(dsmName: string, reason: any): void {
        this.messageService.error("Failed to launch " + dsmName + ": " + reason);
    }

    onDSMResultReceived(dsmName: string, result: string): void {
        this.messageService.info(`${ dsmName } finished working: ${ result }`);
    }
}

