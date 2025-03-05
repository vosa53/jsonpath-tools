import { IRegexp } from "./syntax-analysis/iregexp";
import { isNodesType, isValueType, JSONPathFilterValue, JSONPathLogicalFalse, JSONPathLogicalTrue, JSONPathNothing } from "./types";

export interface JSONPathOptions {
    readonly functions: { [name: string]: JSONPathFunction };
}

export interface JSONPathFunction {
    readonly description: string;
    readonly parameters: readonly JSONPathFunctionParameter[];
    readonly returnType: JSONPathType;
    readonly handler: JSONPathFunctionHandler;
}

export interface JSONPathFunctionParameter {
    readonly name: string;
    readonly description: string;
    readonly type: JSONPathType;
}

export type JSONPathFunctionHandler = (context: JSONPathFunctionContext, ...args: JSONPathFilterValue[]) => JSONPathFilterValue;

export enum JSONPathType {
    valueType = "ValueType",
    logicalType = "LogicalType",
    nodesType = "NodesType"
}

export interface JSONPathFunctionContext {
    reportWarning(message: string): void;
    reportParameterWarning(parameterIndex: number, message: string): void;
}

export const defaultJSONPathOptions: JSONPathOptions = {
    functions: {
        "length": {
            description: "Gets the length of a value.",
            parameters: [
                { name: "value", description: "The value to get the length of.", type: JSONPathType.valueType }
            ],
            returnType: JSONPathType.valueType,
            handler: (context: JSONPathFunctionContext, value: JSONPathFilterValue) => {
                if (!isValueType(value)) throw new Error();

                if (typeof value === "string") return value.length;
                else if (Array.isArray(value)) return value.length;
                else if (typeof value === "object" && value !== null) return Object.keys(value).length;
                else return JSONPathNothing;
            }
        },
        "count": {
            description: "Counts the number of nodes.",
            parameters: [
                { name: "nodes", description: "The nodes to count.", type: JSONPathType.nodesType }
            ],
            returnType: JSONPathType.valueType,
            handler: (context: JSONPathFunctionContext, nodes: JSONPathFilterValue) => {
                if (!isNodesType(nodes)) throw new Error();

                return nodes.nodes.length;
            }
        },
        "match": {
            description: "Matches a text against a pattern.",
            parameters: [
                { name: "text", description: "The text to search.", type: JSONPathType.valueType },
                { name: "pattern", description: "The pattern to match.", type: JSONPathType.valueType }
            ],
            returnType: JSONPathType.logicalType,
            handler: (context: JSONPathFunctionContext, text: JSONPathFilterValue, pattern: JSONPathFilterValue) => {
                if (!isValueType(text)) throw new Error();
                if (!isValueType(pattern)) throw new Error();
                if (typeof text !== "string" || typeof pattern !== "string") return JSONPathLogicalFalse;

                try {
                    const regex = IRegexp.convertToECMAScriptRegExp(pattern, true);
                    return regex.test(text) ? JSONPathLogicalTrue : JSONPathLogicalFalse;
                }
                catch {
                    context.reportParameterWarning(1, "Invalid I-Regexp pattern.");
                    return JSONPathLogicalFalse;
                }
            }
        },
        "search": {
            description: "Searches a text for a pattern.",
            parameters: [
                { name: "text", description: "The text to search.", type: JSONPathType.valueType },
                { name: "pattern", description: "The pattern to search.", type: JSONPathType.valueType }
            ],
            returnType: JSONPathType.logicalType,
            handler: (context: JSONPathFunctionContext, text: JSONPathFilterValue, pattern: JSONPathFilterValue) => {
                if (!isValueType(text)) throw new Error();
                if (!isValueType(pattern)) throw new Error();
                if (typeof text !== "string" || typeof pattern !== "string") return JSONPathLogicalFalse;

                try {
                    const regex = IRegexp.convertToECMAScriptRegExp(pattern, false);
                    return regex.test(text) ? JSONPathLogicalTrue : JSONPathLogicalFalse;
                }
                catch {
                    context.reportParameterWarning(1, "Invalid I-Regexp pattern.");
                    return JSONPathLogicalFalse;
                }
            }
        },
        "value": {
            description: "Gets the value of a node.",
            parameters: [
                { name: "nodes", description: "The nodes to get the value of.", type: JSONPathType.nodesType }
            ],
            returnType: JSONPathType.valueType,
            handler: (context: JSONPathFunctionContext, nodes: JSONPathFilterValue) => {
                if (!isNodesType(nodes)) throw new Error();

                if (nodes.nodes.length === 1) return nodes.nodes[0].value;
                else return JSONPathNothing;
            }
        }
    }
};
