import { ContainerModule } from 'inversify';
import { AstService } from './ast-service';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { IAstService } from "./ast-service-protocol";

export default new ContainerModule(bind => {
    bind(AstService).toSelf().inSingletonScope();
    bind(IAstService).toService(AstService);
    bind(BackendApplicationContribution).toService(AstService);
});
