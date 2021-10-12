import { LanguageClientContribution } from '@theia/languages/lib/browser/language-client-contribution';
import { LanguageGrammarDefinitionContribution } from '@theia/monaco/lib/browser/textmate';
import { PoSTClientContribution } from './language-contribution';
import { PoSTGrammarContribution } from './post-grammar-contribution';

import { ContainerModule } from "inversify";

export default new ContainerModule(bind => {
    bind(LanguageClientContribution).to(PoSTClientContribution);
    bind(LanguageGrammarDefinitionContribution).to(PoSTGrammarContribution);
});
