export interface JSONPathOptions {
    readonly functions: { [name: string]: JSONPathFunction };
}

export interface JSONPathFunction {
    parameterTypes: readonly JSONPathType[];
    returnType: JSONPathType;
    handler: () => void;
}

export enum JSONPathType {
    valueType = "ValueType",
    logicalType = "LogicalType",
    nodesType = "NodesType"
}