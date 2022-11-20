import { JsonRpcServer } from '@theia/core/lib/common/messaging';

// TODO: Find a way to get root dir without it
export const postTheiaRoot = '/home/vlad/post_ide/';

export const dsmWrapperServicePath = '/services/dsmWrapper';

export const IDSMWrapperServer = Symbol('IDSMWrapperServer');

export interface IDSMWrapperServer extends JsonRpcServer<IDSMWrapperClient> {
    scanDSMs(): Promise<string[]>;

    runDSM(id: string, uri: string[], serializedParameters?: string): Promise<void>;
}

export interface IDSMWrapperClient {
    onDSMLaunched(dsmName: string): void;

    onFailedToLaunchDSM(dsmName: string, reason: any): void;

    onDSMResultReceived(dsmName: string, result: string): void;
}

export interface DSMConfiguration {
    id: string;
    name: string;
    parameters: Object;
}
