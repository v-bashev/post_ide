import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { MessageService, ILogger } from "@theia/core/lib/common";
import { IGeneratorServer } from "../common/generator-protocol";

@injectable()
export class GeneratorFrontendService {
    constructor(
        @inject(IGeneratorServer) private readonly generatorServer: IGeneratorServer,
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(ILogger) private readonly logger: ILogger
    ) {}

    async generate(uri: URI) {
        this.logger.info("Should generate artifacts based on " + uri.toString());
        const generationResult = await this.generatorServer.generate(uri.toString());
        this.logger.info("Artifacts can be found at " + generationResult);
        this.messageService.info("Artifacts can be found at " + generationResult);
    }
}