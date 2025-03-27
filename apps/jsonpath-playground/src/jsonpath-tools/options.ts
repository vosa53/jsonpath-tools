import { AnyDataType, ArrayDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, UnionDataType } from "./data-types/data-types";
import { Function, FunctionContext } from "./function";
import { IRegexp } from "./iregexp";
import { isNodesType, isValueType, FilterValue, LogicalFalse, LogicalTrue, Nothing, Type } from "./types";

export interface QueryOptions {
    readonly functions: { [name: string]: Function };
}

export const defaultQueryOptions: QueryOptions = {
    functions: {
        "length": {
            description: "Gets the length of a value.",
            parameters: [
                { name: "value", description: "The value to get the length of.", type: Type.valueType, dataType: UnionDataType.create([PrimitiveDataType.create(PrimitiveDataTypeType.string), ObjectDataType.create(new Map(), AnyDataType.create(), new Set()), ArrayDataType.create([], AnyDataType.create(), 0)]) }
            ],
            returnType: Type.valueType,
            returnDataType: UnionDataType.create([PrimitiveDataType.create(PrimitiveDataTypeType.number), PrimitiveDataType.create(PrimitiveDataTypeType.nothing)]),
            handler: (context: FunctionContext, value: FilterValue) => {
                if (!isValueType(value)) throw new Error();

                if (typeof value === "string") return [...value].length;
                else if (Array.isArray(value)) return value.length;
                else if (typeof value === "object" && value !== null) return Object.keys(value).length;
                else return Nothing;
            }
        },
        "count": {
            description: "Counts the number of nodes.",
            parameters: [
                { name: "nodes", description: "The nodes to count.", type: Type.nodesType, dataType: AnyDataType.create() }
            ],
            returnType: Type.valueType,
            returnDataType: PrimitiveDataType.create(PrimitiveDataTypeType.number),
            handler: (context: FunctionContext, nodes: FilterValue) => {
                if (!isNodesType(nodes)) throw new Error();

                return nodes.nodes.length;
            }
        },
        "match": {
            description: "Matches a text against a pattern.",
            parameters: [
                { name: "text", description: "The text to search.", type: Type.valueType, dataType: PrimitiveDataType.create(PrimitiveDataTypeType.string) },
                { name: "pattern", description: "The pattern to match.", type: Type.valueType, dataType: PrimitiveDataType.create(PrimitiveDataTypeType.string) }
            ],
            returnType: Type.logicalType,
            returnDataType: AnyDataType.create(),
            handler: (context: FunctionContext, text: FilterValue, pattern: FilterValue) => {
                if (!isValueType(text)) throw new Error();
                if (!isValueType(pattern)) throw new Error();
                if (typeof text !== "string" || typeof pattern !== "string") return LogicalFalse;

                try {
                    const regex = IRegexp.convertToECMAScriptRegExp(pattern, true);
                    return regex.test(text) ? LogicalTrue : LogicalFalse;
                }
                catch {
                    context.reportParameterWarning(1, "Invalid I-Regexp pattern.");
                    return LogicalFalse;
                }
            }
        },
        "search": {
            description: "Searches a text for a pattern.",
            parameters: [
                { name: "text", description: "The text to search.", type: Type.valueType, dataType: PrimitiveDataType.create(PrimitiveDataTypeType.string) },
                { name: "pattern", description: "The pattern to search.", type: Type.valueType, dataType: PrimitiveDataType.create(PrimitiveDataTypeType.string) }
            ],
            returnType: Type.logicalType,
            returnDataType: AnyDataType.create(),
            handler: (context: FunctionContext, text: FilterValue, pattern: FilterValue) => {
                if (!isValueType(text)) throw new Error();
                if (!isValueType(pattern)) throw new Error();
                if (typeof text !== "string" || typeof pattern !== "string") return LogicalFalse;

                try {
                    const regex = IRegexp.convertToECMAScriptRegExp(pattern, false);
                    return regex.test(text) ? LogicalTrue : LogicalFalse;
                }
                catch {
                    context.reportParameterWarning(1, "Invalid I-Regexp pattern.");
                    return LogicalFalse;
                }
            }
        },
        "value": {
            description: "Gets the value of a node.",
            parameters: [
                { name: "nodes", description: "The nodes to get the value of.", type: Type.nodesType, dataType: AnyDataType.create() }
            ],
            returnType: Type.valueType,
            returnDataType: AnyDataType.create(),
            handler: (context: FunctionContext, nodes: FilterValue) => {
                if (!isNodesType(nodes)) throw new Error();

                if (nodes.nodes.length === 1) return nodes.nodes[0].value;
                else return Nothing;
            }
        }
    }
};
