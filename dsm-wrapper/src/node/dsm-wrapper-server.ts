import { BackendApplicationContribution } from '@theia/core/lib/node';
import { Application } from 'express';
import { inject, injectable } from 'inversify';
import { ILogger } from '@theia/core';
import { DSMConfiguration, IDSMWrapperClient, IDSMWrapperServer, postTheiaRoot } from "../common/dsm-wrapper-protocols";
import { FileSystem } from "@theia/filesystem/lib/common";
import * as http from "http";
import { RequestOptions } from "http";
import { DSMResult } from "./dsm-result";
import { IAstService } from "ast-service/lib/node/ast-service-protocol";
import { WorkspaceServer } from "@theia/workspace/lib/common";

@injectable()
export class DSMWrapperServer implements IDSMWrapperServer, BackendApplicationContribution {
    private client?: IDSMWrapperClient;
    private server: http.Server;
    private port = 8025;
    private dsmPort = '8024';
    private DSMs: DSMConfiguration[];

    constructor(
        @inject(FileSystem) private readonly fileSystem: FileSystem,
        @inject(WorkspaceServer) private readonly workspaceServer: WorkspaceServer,
        @inject(IAstService) private readonly astService: IAstService,
        @inject(ILogger) private readonly logger: ILogger
    ) {}

    initialize() {
        this.server = http.createServer((req, res) => {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            req.on('end', () => {
                let result: DSMResult = JSON.parse(body);
                let dsmName = this.getDSMNameById(result.id);
                this.client?.onDSMResultReceived(dsmName, result.result);
                res.statusCode = 200;
                res.end();
            });
        })
        this.server.listen(this.port);
        console.log("DSM wrapper server listens to " + this.port);
    }

    setClient(client: IDSMWrapperClient): void {
        this.logger.info("Set client");
        this.client = client;
    }

    async scanDSMs(): Promise<DSMConfiguration[]> {
        const fileStat = await this.fileSystem.getFileStat("file:" + postTheiaRoot + "dsm-wrapper/DSMs/Configurations");
        const files = fileStat?.children?.filter(stat => stat.uri.endsWith('.json'));
        if (files) {
            return await Promise.all(files.map(async fileStat => {
                return await new Promise<DSMConfiguration>(async (res, rej) => {
                    let encoding = "utf8";
                    const resolved = await this.fileSystem.resolveContent(fileStat.uri, { encoding });
                    let config: DSMConfiguration = JSON.parse(resolved.content);
                    res(config);
                });
            }))
                .then(DSMs => {
                    this.DSMs = DSMs;
                    return DSMs;
                });
        } else {
            return new Promise(resolve => resolve([]));
        }
    }

    runDSM(id: string, uri: string[], serializedParameters?: string): Promise<void> {
        console.log("Run DSM for URI: " + uri);

        let workspace = this.workspaceServer.getMostRecentlyUsedWorkspace()
            .then(workspace => this.fileSystem.getFsPath(workspace!))
            .then(path => {
                console.log("Workspace: " + path);
                return path!;
            });

        return workspace
            .then(workspace => {
                return Promise.all(uri.map(uri => this.astService.getAST(uri)))
                    .then(URIs => {
                        return [workspace, URIs]
                    })
            })
            .then(result => {
                console.log("Received AST");
                // TODO: Make few requests for few ASTs. Taking only the 1st one for the moment
                let ast = result[1][0];
                let fileName = uri[0].split('/').pop()!.split('.')[0];
                let body = `${id}\n${result[0]}\n${fileName}\n${ast}`
                let postOptions = {
                    host: '127.0.0.1',
                    port: this.dsmPort,
                    path: '/' + id,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                    }
                };
                return this.makeRunDSMRequest(body, postOptions)
                    .then(message => {
                        let dsmName = this.getDSMNameById(id);
                        console.log("Message: " + message);
                        this.client?.onDSMLaunched(dsmName);
                    }, error => {
                        let dsmName = this.getDSMNameById(id);
                        this.client?.onFailedToLaunchDSM(dsmName, error);
                        return error
                    });
            })
    }

    onStop(app?: Application) {
        this.dispose();
    }

    dispose(): void {
        this.server.close();
    }

    private getDSMNameById(id: string): string {
        let dsmConfig = this.DSMs.find(config => {
            return config.id == id
        })
        return dsmConfig?.name ?? 'Undefined'
    }

    private makeRunDSMRequest(body: string, options: RequestOptions): Promise<any> {
        return new Promise<http.IncomingMessage>(((resolve, reject) => {
            let post = http.request(options, res => {
                res.on('data', data => {
                    resolve(data)
                })
                res.on('error', error => {
                    reject(error)
                })
            })
            post.write(body);
            post.end();
        }));
    }
}