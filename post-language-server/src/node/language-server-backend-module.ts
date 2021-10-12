import { ContainerModule } from 'inversify';
import { LanguageServerContribution } from '@theia/languages/lib/node';
import { PoSTLanguageServerContribution } from './post-language-server-contribution';

export default new ContainerModule(bind => {
    bind(LanguageServerContribution).to(PoSTLanguageServerContribution).inSingletonScope;
});