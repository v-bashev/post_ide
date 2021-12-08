import { BackendApplicationContribution } from '@theia/core/lib/node';
import { ProcessErrorEvent } from '@theia/process/lib/node/process';
import { RawProcess, RawProcessFactory } from '@theia/process/lib/node/raw-process';
import * as cp from 'child_process';
import { Application } from 'express';
import * as glob from 'glob';
import { inject, injectable } from 'inversify';
import * as net from 'net';
import * as path from 'path';
import * as rpc from 'vscode-jsonrpc';
import { createSocketConnection } from 'vscode-ws-jsonrpc/lib/server';

import { IAstService } from './ast-service-protocol';
import { ILogger } from '@theia/core';

const DEFAULT_PORT = 8023;

@injectable()
export class AstService implements IAstService, BackendApplicationContribution {
    private startedServer: boolean = false;
    private connection?: rpc.MessageConnection;

    constructor(
        @inject(RawProcessFactory) private readonly processFactory: RawProcessFactory,
        @inject(ILogger) private readonly logger: ILogger
    ) {}

    initialize() {
        let port = this.getPort();
        if (!port) {
            port = DEFAULT_PORT
        }
        if (!this.startedServer) {
            this.startServer(port).then(() => this.connect(port!));
        } else {
            this.connect(port);
        }
    }

    private getPort(): number | undefined {
        const arg = process.argv.filter(arg => arg.startsWith('--AST_SERVICE_PORT='))[0];
        if (!arg) {
            return undefined;
        } else {
            return Number.parseInt(arg.substring('--AST_SERVICE_PORT='.length), 10);
        }
    }

    private async startServer(port: number) {
        const serverPath = path.resolve(__dirname, '..', '..', 'build');
        const jarPaths = glob.sync('**/su.nsk.iae.post.astwrapper-1.0.jar', { cwd: serverPath });
        if (jarPaths.length === 0) {
            throw new Error('The AST Wrapper server launcher is not found.');
        }
        const jarPath = path.resolve(serverPath, jarPaths[0]);
        const command = 'java';
        const args: string[] = [];
        args.push('-jar', jarPath);
        args.push('-host', 'localhost', '-port', DEFAULT_PORT.toString());
        this.logger.info('[AST Service] Spawn Process with command ' + command + ' and arguments ' + args);
        const process = await this.spawnProcessAsync(command, args);
        this.logger.info('[AST Service] Spawned process, waiting for server to be ready');
        await this.waitUntilServerReady(process);
        this.logger.info('[AST Service] Server communicated to be ready');
        this.startedServer = true;
    }

    private async connect(port: number) {
        const socket = new net.Socket();
        const connection = createSocketConnection(socket, socket, () => {
            this.logger.info('[AST Service] Socket connection disposed');
            socket.destroy();
        });
        socket.connect(port!);
        this.connection = rpc.createMessageConnection(connection.reader, connection.writer);
        this.connection.listen();
    }

    protected spawnProcessAsync(command: string, args?: string[], options?: cp.SpawnOptions): Promise<RawProcess> {
        const rawProcess = this.processFactory({ command, args, options });
        rawProcess.errorStream.on('data', this.showError.bind(this));
        return new Promise<RawProcess>((resolve, reject) => {
            rawProcess.onError((error: ProcessErrorEvent) => {
                this.onDidFailSpawnProcess(error);
                if (error.code === 'ENOENT') {
                    const guess = command.split(/\s+/).shift();
                    if (guess) {
                        reject(new Error(`Failed to spawn ${guess}\nPerhaps it is not on the PATH.`));
                        return;
                    }
                }
                reject(error);
            });
            process.nextTick(() => resolve(rawProcess));
        });
    }

    protected showError(data: string | Buffer) {
        this.logger.error(data.toString());
    }

    private waitUntilServerReady(process: RawProcess): Promise<any> {
        return new Promise<any>(resolve =>
            process.outputStream.on('data', data => {
                const message = String.fromCharCode.apply(null, data);
                this.logger.info('[AST Service] Server output: ' + message);
                if (message.includes('Ready')) {
                    return resolve(data);
                }
            })
        );
    }

    protected onDidFailSpawnProcess(error: Error): void {
        this.logger.error('[AST Service] Fail to spawn process: ' + error.message);
    }

    getAST(fileUri: string): Promise<string> {
        return new Promise<string>(((resolve, reject) => {
            if (this.connection) {
                this.connection.sendRequest(this.createGetSerializedAstRequest(), fileUri)
                    .then(res => resolve(res), rej => reject(rej));
            } else {
                reject(new Error('No connection to AST wrapper server'));
            }
        }))
    }

    createGetSerializedAstRequest(): rpc.RequestType<string, string, Error, void> {
        return new rpc.RequestType<string, string, Error, void>('getSerializedAST');
    }

    onStop(app?: Application) {
        this.dispose();
    }

    dispose(): void {
        if (this.connection) {
            this.connection.dispose();
        }
    }
}