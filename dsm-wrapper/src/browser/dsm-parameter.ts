export class DSMParameter {
    constructor(readonly name: string, readonly type: DSMParameterType) {}
}

export const enum DSMParameterType {
    String = "string",
    Number = "number",
    Boolean = "boolean"
}