import { AnyDataType, ArrayDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, UnionDataType } from "../data-types/data-types";
import { IRegexp } from "../iregexp";
import { Type, FilterValue, isNodesType, isValueType, Nothing, LogicalFalse, LogicalTrue } from "../values/types";
import { Function, FunctionContext } from "./function";

/**
 * Standard JSONPath `length` function.
 * 
 * Gets the length of a value.
 */
export const lengthFunction: Function = {
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
};

/**
 * Standard JSONPath `count` function.
 * 
 * Counts the number of nodes.
 */
export const countFunction: Function = {
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
};

/**
 * Standard JSONPath `match` function.
 * 
 * Matches a text against a pattern.
 */
export const matchFunction: Function = {
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
};

/**
 * Standard JSONPath `search` function.
 * 
 * Searches a text for a pattern.
 */
export const searchFunction: Function = {
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
};

/**
 * Standard JSONPath `value` function.
 * 
 * Gets a value of a node.
 */
export const valueFunction: Function = {
    description: "Gets a value of a node.",
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
};
