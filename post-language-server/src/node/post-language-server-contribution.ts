import { BaseLanguageServerContribution, IConnection, LanguageServerStartOptions } from '@theia/languages/lib/node';
import { injectable } from 'inversify';
import * as path from 'path';
import * as net from 'net';
import { createSocketConnection } from 'vscode-ws-jsonrpc/lib/server';

import { POST_LANGUAGE_SERVER_ID, POST_LANGUAGE_SERVER_NAME, POST_LANGUAGE_SERVER_JAR_NAME } from '../common';

@injectable()
export class PoSTLanguageServerContribution extends BaseLanguageServerContribution {
    readonly id = POST_LANGUAGE_SERVER_ID;    
    readonly name = POST_LANGUAGE_SERVER_NAME;

    start(clientConnection: IConnection, options: LanguageServerStartOptions): void {
        let socketPort = this.getPort();
        if (socketPort) {
            const socket = new net.Socket();
            const serverConnection = createSocketConnection(socket, socket, () => {
                socket.destroy();
            })
            this.forward(clientConnection, serverConnection);
            socket.connect(socketPort);
        } else {
            console.log('No port available')
            const jar = path.resolve(path.join(__dirname, '..', '..', 'build', POST_LANGUAGE_SERVER_JAR_NAME));
            const command = 'java';
            const args: string[] = [
                '-jar',
                jar
            ]
            const serverConnection = this.createProcessStreamConnection(command, args);
            this.forward(clientConnection, serverConnection);
        }
    }
    
    getPort(): number | undefined {
        const parameter = '--POST_LSP=';
        let arg = process.argv.filter(arg => arg.startsWith(parameter))[0];
        if (!arg) {
            return undefined;
        } else {
            return Number.parseInt(arg.substring(parameter.length), 10);
        }
    }
}