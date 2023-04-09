import { BackendApplicationContribution } from '@theia/core/lib/node';
import { Application } from 'express';
import { inject, injectable } from 'inversify';
import { ILogger } from '@theia/core';
import { IDSMWrapperClient, IDSMWrapperServer } from '../common/dsm-wrapper-protocols';
import * as http from 'http';
import { ProcessErrorEvent } from '@theia/process/lib/node/process';
import { RawProcess, RawProcessFactory } from '@theia/process/lib/node/raw-process';
import * as rpc from 'vscode-jsonrpc';
import * as path from 'path';
import * as glob from 'glob';
import * as cp from 'child_process';
import * as net from 'net';
import { createSocketConnection } from 'vscode-ws-jsonrpc/lib/server';
import { RequestOptions } from 'http';
import { IAstService } from 'ast-service/lib/node/ast-service-protocol';

@injectable()
export class DSMWrapperServer implements IDSMWrapperServer, BackendApplicationContribution {
    private managerPort: string;
    private started: boolean = false;
    private connection?: rpc.MessageConnection;

    constructor(
        @inject(IAstService) private readonly astService: IAstService,
        @inject(RawProcessFactory) private readonly processFactory: RawProcessFactory,
        @inject(ILogger) private readonly logger: ILogger
    ) { }

    initialize() {
        this.logger.info('[DSM manager] Initialization').then(() => { })
        if (!this.started) {
            this.startManager().then(() => this.connect());
        } else {
            this.connect();
        }
    }

    setClient(client: IDSMWrapperClient): void {
        this.logger.info('Set client');
    }

    async scanDSMs(): Promise<string[]> {
        return new Promise<string[]>(((resolve, _) => {
            if (this.connection) {
                this.resolveDSMs(resolve);
            } else {
                setTimeout(() => this.resolveDSMs(resolve), 2000);
            }
        }));
    }

    private resolveDSMs(resolve: (value: string[] | PromiseLike<string[]>) => void): void {
        this.getRequest('alive-modules').then(result => {
            const DSMs: string[] = [];
            const content = JSON.parse(result)['content'];
            content['modules']?.forEach((module: any) => DSMs.push(module['name']))
            resolve(DSMs);
        }).catch(_ => {
            this.resolveDSMs(resolve)
        });
    }

    runDSM(id: string, uri: string[], serializedParameters?: string): Promise<void> {
        return new Promise<void>(((resolve, reject) => {
            if (this.connection) {
                this.astService.getAST(uri[0]).then((ast: string) => {
                    const nameOffset = uri[0].lastIndexOf('/');
                    const fileName = uri[0].substring(nameOffset + 1);
                    const body = {
                        id: id,
                        root: uri[0].substring(7, nameOffset),
                        fileName: fileName.substring(0, fileName.lastIndexOf('.')),
                        ast: ast
                    };
                    this.postRequest('run/' + id, JSON.stringify(body)).then(result => {
                        resolve();
                    });
                });
            } else {
                reject(new Error('No connection to AST wrapper server'));
            }
        }));
    }

    onStop(app?: Application) {
        this.dispose();
    }

    dispose(): void {
        if (this.connection) {
            this.connection.dispose();
        }
    }

    private async startManager(): Promise<void> {
        const stuffPath = path.resolve(__dirname, '..', '..', 'build');
        const jarPaths = glob.sync('**/manager.jar', { cwd: stuffPath });
        if (jarPaths.length === 0) {
            throw new Error('The DSM manager launcher was not found.');
        }
        const amJsonPaths = glob.sync('**/available-modules.json', { cwd: stuffPath });
        if (amJsonPaths.length === 0) {
            throw new Error('The available-modules.json file was not found.');
        }
        const jarPath = path.resolve(stuffPath, jarPaths[0]);
        const amJsonPath = path.resolve(stuffPath, amJsonPaths[0]);
        this.managerPort = this.getPort();
        const command = 'java';
        const args: string[] = [];
        args.push('-jar', jarPath);
        args.push('-amj', amJsonPath, '-sam', '-p', this.managerPort);
        await this.logger.info('[DSM manager] Spawning launch process with command ' + command + ' and arguments ' + args);
        await this.spawnProcessAsync(command, args);
        await this.logger.info('[DSM manager] Spawned launch process');
        this.started = true;
    }

    private async connect(): Promise<void> {
        const port = this.managerPort;
        const socket = new net.Socket();
        const connection = createSocketConnection(socket, socket, () => {
            this.logger.info('[AST Service] Socket connection disposed');
            socket.destroy();
        });
        socket.connect(port!);
        this.connection = rpc.createMessageConnection(connection.reader, connection.writer);
        this.connection.listen();
    }

    private getPort() {
        const stuffPath = path.resolve(__dirname, '..', '..', 'build');
        const mpPaths = glob.sync('**/manager.properties', { cwd: stuffPath });
        if (mpPaths.length === 0) {
            throw new Error('The manager.properties file was not found.');
        }
        const mpPath = path.resolve(stuffPath, mpPaths[0]);
        const propertiesReader = require('properties-reader');
        const properties = propertiesReader(mpPath);
        return properties.get('port');
    }

    private spawnProcessAsync(
        command: string,
        args?: string[],
        options?: cp.SpawnOptions
    ): Promise<RawProcess> {
        const rawProcess = this.processFactory({ command, args, options });
        // rawProcess.outputStream.on('data', this.showInfo.bind(this));
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

    // private showInfo(data: string | Buffer) {
    //     this.logger.info(data.toString()).then(() => { });
    // }

    private showError(data: string | Buffer) {
        this.logger.error(data.toString()).then(() => { });
    }

    private onDidFailSpawnProcess(error: Error): void {
        this.logger.error('[DSM manager] Failed to spawn process: ' + error.message).then(() => { });
    }

    private getRequest(command: string, body?: string): Promise<any> {
        const request: RequestOptions = {
            host: '127.0.0.1',
            port: this.managerPort,
            path: '/' + command,
            method: 'GET'
        };
        return this.sendRequest(request, body);
    }

    private postRequest(command: string, body?: string): Promise<any> {
        const request: RequestOptions = {
            host: '127.0.0.1',
            port: this.managerPort,
            path: '/' + command,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        return this.sendRequest(request, body);
    }

    private sendRequest(options: RequestOptions, body?: string): Promise<any> {
        return new Promise<http.IncomingMessage>(((resolve, reject) => {
            const request = http.request(options, res => {
                res.setEncoding('utf8');
                res.on('data', data => {
                    resolve(data)
                });
                res.on('error', error => {
                    reject(error)
                });
            });
            request.setTimeout(2000);
            request.on('error', (e) => {
                reject(e)
            });
            if (body != undefined) {
                request.write(body);
            }
            request.end();
        }));
    }
}