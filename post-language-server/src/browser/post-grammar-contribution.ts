import { LanguageGrammarDefinitionContribution, TextmateRegistry } from '@theia/monaco/lib/browser/textmate';
import { injectable } from 'inversify';
import { POST_LANGUAGE_FILE_EXTENSION, POST_LANGUAGE_SERVER_ID, POST_LANGUAGE_SERVER_NAME } from '../common';

@injectable()
export class PoSTGrammarContribution implements LanguageGrammarDefinitionContribution {
    readonly scopeName = 'source.post';

    registerTextmateLanguage(registry: TextmateRegistry) {
        monaco.languages.register({
            id: POST_LANGUAGE_SERVER_ID,
            aliases: [
                POST_LANGUAGE_SERVER_NAME, POST_LANGUAGE_SERVER_ID
            ],
            extensions: [
                POST_LANGUAGE_FILE_EXTENSION,
            ],
            mimetypes: [
                'text/sm'
            ]
        });
        monaco.languages.setLanguageConfiguration(POST_LANGUAGE_SERVER_ID, this.configuration);
        monaco.languages.register

        registry.registerTextmateGrammarScope(this.scopeName, {
            async getGrammarDefinition() {
                return {
                    format: 'json',
                    content: require('../../data/post.tmLanguage.json')
                }
            }
        });
        registry.mapLanguageIdToTextmateGrammar(POST_LANGUAGE_SERVER_ID, this.scopeName);
    }

    protected configuration: monaco.languages.LanguageConfiguration = {
        'comments': {
            'lineComment': '//',
            'blockComment': ['/*', '*/']
        },
        'brackets': [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        'autoClosingPairs': [
            { 'open': '{', 'close': '}' },
            { 'open': '[', 'close': ']' },
            { 'open': '(', 'close': ')' },
            { 'open': "'", 'close': "'", 'notIn': ['string', 'comment'] },
            { 'open': '"', 'close': '"', 'notIn': ['string'] },
            { 'open': '/*', 'close': ' */', 'notIn': ['string'] }
        ],
        'surroundingPairs': [
            { 'open': '{', 'close': '}' },
            { 'open': '[', 'close': ']' },
            { 'open': '(', 'close': ')' },
            { 'open': "'", 'close': "'" },
            { 'open': '"', 'close': '"' },
            { 'open': '`', 'close': '`' }
        ],
        'folding': {
            'markers': {
                'start': new RegExp('^\\s*//\\s*#?region\\b'),
                'end': new RegExp('^\\s*//\\s*#?endregion\\b')
            }
        }
    };
}