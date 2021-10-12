export const IAstService = Symbol('IAstService');

export interface IAstService {
    getAST(fileUri: string): Promise<string>
}