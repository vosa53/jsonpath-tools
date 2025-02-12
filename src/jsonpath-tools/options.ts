import { isNodesType, isValueType, JSONPathFilterValue, JSONPathLogicalFalse, JSONPathLogicalTrue, JSONPathNothing } from "./types";

export interface JSONPathOptions {
    readonly functions: { [name: string]: JSONPathFunction };
}

export interface JSONPathFunction {
    parameterTypes: readonly JSONPathType[];
    returnType: JSONPathType;
    handler: (...args: JSONPathFilterValue[]) => JSONPathFilterValue;
}

export enum JSONPathType {
    valueType = "ValueType",
    logicalType = "LogicalType",
    nodesType = "NodesType"
}

export const defaultJSONPathOptions: JSONPathOptions = {
    functions: {
        "length": {
            handler: (value: JSONPathFilterValue) => {
                if (!isValueType(value)) throw new Error();

                if (typeof value === "string") return value.length;
                else if (Array.isArray(value)) return value.length;
                else if (typeof value === "object" && value !== null) return Object.keys(value).length;
                else return JSONPathNothing;
            },
            parameterTypes: [JSONPathType.valueType],
            returnType: JSONPathType.valueType
        },
        "count": {
            handler: (nodes: JSONPathFilterValue) => {
                if (!isNodesType(nodes)) throw new Error();

                return nodes.nodes.length;
            },
            parameterTypes: [JSONPathType.nodesType],
            returnType: JSONPathType.valueType
        },
        "match": {
            handler: (text: JSONPathFilterValue, pattern: JSONPathFilterValue) => {
                if (!isValueType(text)) throw new Error();
                if (!isValueType(pattern)) throw new Error();
                if (typeof text !== "string" || typeof pattern !== "string" || !isRFC9485Regex(pattern)) return JSONPathLogicalFalse;

                return new RegExp(pattern).test(text) ? JSONPathLogicalTrue : JSONPathLogicalFalse
            },
            parameterTypes: [JSONPathType.valueType, JSONPathType.valueType],
            returnType: JSONPathType.logicalType
        },
        "search": {
            handler: (text: JSONPathFilterValue, pattern: JSONPathFilterValue) => {
                if (!isValueType(text)) throw new Error();
                if (!isValueType(pattern)) throw new Error();
                if (typeof text !== "string" || typeof pattern !== "string" || !isRFC9485Regex(pattern)) return JSONPathLogicalFalse;

                return new RegExp(pattern).test(text) ? JSONPathLogicalTrue : JSONPathLogicalFalse
            },
            parameterTypes: [JSONPathType.valueType, JSONPathType.valueType],
            returnType: JSONPathType.logicalType
        },
        "value": {
            handler: (nodes: JSONPathFilterValue) => {
                if (!isNodesType(nodes)) throw new Error();

                if (nodes.nodes.length === 1) return nodes.nodes[0];
                else return JSONPathNothing;
            },
            parameterTypes: [JSONPathType.nodesType],
            returnType: JSONPathType.valueType
        }
    }
};

function isRFC9485Regex(pattern: string): boolean {
    // TODO: Implement RFC 9485 regex validation.
    return true;
}