import { JsonRpcServer } from '@theia/core/lib/common/messaging';

export const generatorServicePath = '/services/generators';

export const IGeneratorServer = Symbol('IGeneratorServer');

export interface IGeneratorServer extends JsonRpcServer<IGeneratorClient> {
    generate(fileUri: string): Promise<string>
}

export interface IGeneratorClient {
    onGenerationStatusUpdated(status: string): void;
}