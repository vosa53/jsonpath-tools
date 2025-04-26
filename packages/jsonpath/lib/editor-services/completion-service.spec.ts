import { describe, expect, it } from "vitest";
import { AnyDataType, ArrayDataType, DataType, DataTypeAnnotation, NeverDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType } from "../data-types/data-types";
import { parseQueryAndPosition, testQueryOptions } from "../helpers/test-utils";
import { JSONValue } from "../json/json-types";
import { TextRange } from "../text/text-range";
import { CompletionItem, CompletionItemTextType, CompletionItemType, CompletionService } from "./completion-service";

describe("Completion service", () => {
    it("provideCompletions - Returns completion items for a name selector using a concrete data", () => {
        expect(new Set(provideCompletions(`$.abc.|`, queryArgument, undefined))).toEqual(new Set([
            new CompletionItem(CompletionItemType.syntax, `*`, new TextRange(6, 0), `*`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.name, `def`, new TextRange(6, 0), `def`, `array`, expect.any(Function)),
            new CompletionItem(CompletionItemType.name, `name`, new TextRange(6, 0), `name`, `string`, expect.any(Function))
        ]));
    });

    it("provideCompletions - Returns completion items for a name selector using a type", () => {
        expect(new Set(provideCompletions(`$.abc.|`, undefined, queryArgumentType))).toEqual(new Set([
            new CompletionItem(CompletionItemType.syntax, `*`, new TextRange(6, 0), `*`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.name, `def`, new TextRange(6, 0), `def`, `array`, expect.any(Function)),
            new CompletionItem(CompletionItemType.name, `name`, new TextRange(6, 0), `name`, `string`, expect.any(Function))
        ]));
    });

    it("provideCompletions - Returns completion items for a bracketed name selector using a concrete data", () => {
        expect(new Set(provideCompletions(`$.abc[|]`, queryArgument, undefined))).toEqual(new Set([
            new CompletionItem(CompletionItemType.syntax, `*`, new TextRange(6, 0), `*`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `?`, new TextRange(6, 0), `?`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `::`, new TextRange(6, 0), `::`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `\${start}:\${end}:\${step}`, new TextRange(6, 0), `start:end:step`, undefined, expect.any(Function), CompletionItemTextType.snippet),
            new CompletionItem(CompletionItemType.name, `"def"`, new TextRange(6, 0), `"def"`, `array`, expect.any(Function)),
            new CompletionItem(CompletionItemType.name, `"name"`, new TextRange(6, 0), `"name"`, `string`, expect.any(Function))
        ]));
    });

    it("provideCompletions - Returns completion items for a bracketed name selector using a type", () => {
        expect(new Set(provideCompletions(`$.abc[|]`, undefined, queryArgumentType))).toEqual(new Set([
            new CompletionItem(CompletionItemType.syntax, `*`, new TextRange(6, 0), `*`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `?`, new TextRange(6, 0), `?`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `::`, new TextRange(6, 0), `::`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `\${start}:\${end}:\${step}`, new TextRange(6, 0), `start:end:step`, undefined, expect.any(Function), CompletionItemTextType.snippet),
            new CompletionItem(CompletionItemType.name, `"def"`, new TextRange(6, 0), `"def"`, `array`, expect.any(Function)),
            new CompletionItem(CompletionItemType.name, `"name"`, new TextRange(6, 0), `"name"`, `string`, expect.any(Function))
        ]));
    });

    it("provideCompletions - Returns completions items for functions", () => {
        expect(new Set(provideCompletions(`$.abc[?f|]`, queryArgument, undefined))).toEqual(new Set([
            new CompletionItem(CompletionItemType.function, `foo`, new TextRange(7, 1), `foo`, `LogicalType`, expect.any(Function)),
            new CompletionItem(CompletionItemType.function, `bar`, new TextRange(7, 1), `bar`, `ValueType`, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `true`, new TextRange(7, 1), `true`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `false`, new TextRange(7, 1), `false`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.syntax, `null`, new TextRange(7, 1), `null`, undefined, expect.any(Function))
        ]));
    });

    it("provideCompletions - Returns completion items for a value using a concrete data", () => {
        expect(new Set(provideCompletions(`$[?@.name == "|"]`, queryArgument, undefined))).toEqual(new Set([
            new CompletionItem(CompletionItemType.literal, `"Some name"`, new TextRange(13, 2), `"Some name"`, `string`, expect.any(Function)),
        ]));
    });

    it("provideCompletions - Returns completion items for a value using a type", () => {
        expect(new Set(provideCompletions(`$[?@.name == "|"]`, undefined, queryArgumentType))).toEqual(new Set([
            new CompletionItem(CompletionItemType.literal, `"Some name"`, new TextRange(13, 2), `"Some name"`, `string`, expect.any(Function)),
        ]));
    });
});

const queryArgument = {
    abc: {
        def: [],
        name: "Some name"
    }
};

const queryArgumentType = ObjectDataType.create(new Map([
    ["abc", ObjectDataType.create(new Map([
        ["def", ArrayDataType.create([], AnyDataType.create(), 0)],
        ["name", PrimitiveDataType.create(PrimitiveDataTypeType.string, new Set([new DataTypeAnnotation("", "", false, false, false, "Some name", [])]))]
    ]), NeverDataType.create(), new Set())]
]), NeverDataType.create(), new Set());

function provideCompletions(queryText: string, queryArgument: JSONValue | undefined = undefined, queryArgumentType: DataType = AnyDataType.create()): CompletionItem[] {
    const { query, position } = parseQueryAndPosition(queryText);
    const completionService = new CompletionService(testQueryOptions);
    const completions = completionService.provideCompletions(query, queryArgument, queryArgumentType, position);
    return completions;
}
