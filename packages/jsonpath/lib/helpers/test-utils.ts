import { AnyDataType } from "../data-types/data-types";
import { Function, FunctionContext } from "../functions/function";
import { QueryOptions } from "../query-options";
import { Query } from "../query/query";
import { Parser } from "../syntax-analysis/parser";
import { Type, FilterValue, LogicalTrue } from "../values/types";

// Helpers for tests.

export const fooFunction: Function = {
    description: "Lorem impsum",
    parameters: [
        { name: "abc", description: "Lorem impsum", type: Type.valueType, dataType: AnyDataType.create() },
        { name: "def", description: "Lorem impsum", type: Type.nodesType, dataType: AnyDataType.create() }
    ],
    returnType: Type.logicalType,
    returnDataType: AnyDataType.create(),
    handler: (context: FunctionContext, abc: FilterValue, def: FilterValue) => {
        return LogicalTrue;
    }
};

export const barFunction: Function = {
    description: "Lorem impsum",
    parameters: [
        { name: "abc", description: "Lorem impsum", type: Type.valueType, dataType: AnyDataType.create() }
    ],
    returnType: Type.valueType,
    returnDataType: AnyDataType.create(),
    handler: (context: FunctionContext, abc: FilterValue) => {
        return 123;
    }
};

export const testQueryOptions: QueryOptions = {
    functions: {
        "foo": fooFunction,
        "bar": barFunction
    }
};

export function parseQueryAndPosition(queryText: string): { query: Query; position: number; } {
    const CARET_PLACEHOLDER_CHARACTER = "|";
    const position = queryText.indexOf(CARET_PLACEHOLDER_CHARACTER);
    const queryTextWithoutCaret = queryText.replaceAll(CARET_PLACEHOLDER_CHARACTER, "");
    const parser = new Parser();
    const query = parser.parse(queryTextWithoutCaret);
    return { query, position };
}
