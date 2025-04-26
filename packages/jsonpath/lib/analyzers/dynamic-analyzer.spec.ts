import { describe, expect, it } from "vitest";
import { Diagnostics, DiagnosticsSeverity } from "../diagnostics";
import { testQueryOptions } from "../helpers/test-utils";
import { Parser } from "../syntax-analysis/parser";
import { TextRange } from "../text/text-range";
import { DynamicAnalyzer } from "./dynamic-analyzer";
import { QueryOptions } from "../options";
import { AnyDataType } from "../data-types/data-types";
import { FunctionContext } from "../functions/function";
import { Type, FilterValue, LogicalTrue } from "../values/types";

describe("Dynamic analyzer", () => {
    it("analyze - Valid query does not report diagnostics", () => {
        expect(analyze(`$.items[0]`)).toEqual([]);
    });

    it("analyze - Unknown property reports a warning", () => {
        expect(analyze(`$.itms`)).toEqual([
            new Diagnostics(DiagnosticsSeverity.warning, expect.any(String), new TextRange(2, 4))
        ]);
    });

    it("analyze - Unknown index reports a warning", () => {
        expect(analyze(`$.items[3]`)).toEqual([
            new Diagnostics(DiagnosticsSeverity.warning, expect.any(String), new TextRange(8, 1))
        ]);
    });

    it("analyze - Slice selector that does not select anything reports a warning", () => {
        expect(analyze(`$.items[2:1]`)).toEqual([
            new Diagnostics(DiagnosticsSeverity.warning, expect.any(String), new TextRange(8, 3))
        ]);
    });

    it("analyze - Wildcard selector that does not select anything reports a warning", () => {
        expect(analyze(`$.empty.*`)).toEqual([
            new Diagnostics(DiagnosticsSeverity.warning, expect.any(String), new TextRange(8, 1))
        ]);
    });

    it("analyze - Filter that is always LogicalFalse reports a warning", () => {
        expect(analyze(`$.items[?@ == "ddd"]`)).toEqual([
            new Diagnostics(DiagnosticsSeverity.warning, expect.any(String), new TextRange(8, 11))
        ]);
    });

    it("analyze - Reports a warning from a function", () => {
        const queryOptions: QueryOptions = {
            functions: {
                test: {
                    description: "Lorem impsum",
                    parameters: [],
                    returnType: Type.logicalType,
                    returnDataType: AnyDataType.create(),
                    handler: (context: FunctionContext) => {
                        context.reportWarning("Some warning from a function.");
                        return LogicalTrue;
                    }
                }
            }
        };
        expect(analyze(`$.items[?test()]`, queryOptions)).toEqual([
            new Diagnostics(DiagnosticsSeverity.warning, "Some warning from a function.", new TextRange(9, 4))
        ]);
    });

    it("analyze - Reports a parameter warning from a function", () => {
        const queryOptions: QueryOptions = {
            functions: {
                test: {
                    description: "Lorem impsum",
                    parameters: [
                        { name: "abc", description: "Lorem impsum", type: Type.valueType, dataType: AnyDataType.create() },
                    ],
                    returnType: Type.logicalType,
                    returnDataType: AnyDataType.create(),
                    handler: (context: FunctionContext, abc: FilterValue) => {
                        context.reportParameterWarning(0, "Some parameter warning from a function.");
                        return LogicalTrue;
                    }
                }
            }
        };
        expect(analyze(`$.items[?test("abc")]`, queryOptions)).toEqual([
            new Diagnostics(DiagnosticsSeverity.warning, "Some parameter warning from a function.", new TextRange(14, 5))
        ]);
    });
});

const queryArgument = {
    items: [
        "aaa",
        "bbb",
        "ccc"
    ],
    empty: {}
};

function analyze(queryText: string, queryOptions: QueryOptions = testQueryOptions): readonly Diagnostics[] {
    const parser = new Parser();
    const query = parser.parse(queryText);
    const dynamicAnalyzer = new DynamicAnalyzer(queryOptions);
    const analyzerResult = dynamicAnalyzer.analyze(query, queryArgument);
    return analyzerResult.diagnostics;
}