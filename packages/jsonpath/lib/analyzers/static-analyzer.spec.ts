import { describe, expect, it } from "vitest";
import { ArrayDataType, LiteralDataType, NeverDataType, ObjectDataType } from "../data-types/data-types";
import { Diagnostics, DiagnosticsSeverity } from "../diagnostics";
import { testQueryOptions } from "../helpers/test-utils";
import { Parser } from "../syntax-analysis/parser";
import { TextRange } from "../text/text-range";
import { StaticAnalyzer } from "./static-analyzer";

describe("Static analyzer", () => {
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

    // TODO
    /*it("analyze - Slice selector that does not select anything reports a warning", () => {
        expect(analyze(`$.items[2:1]`)).toEqual([
            new Diagnostics(DiagnosticsType.warning, expect.any(String), new TextRange(8, 3))
        ]);
    });*/

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
});

const queryArgumentType = ObjectDataType.create(new Map([
    ["items", ArrayDataType.create([
        LiteralDataType.create("aaa"),
        LiteralDataType.create("bbb"),
        LiteralDataType.create("ccc")
    ], NeverDataType.create(), 3)],
    ["empty", ObjectDataType.create(new Map(), NeverDataType.create(), new Set())]
]), NeverDataType.create(), new Set())

function analyze(queryText: string): readonly Diagnostics[] {
    const parser = new Parser();
    const query = parser.parse(queryText);
    const staticAnalyzer = new StaticAnalyzer(testQueryOptions);
    const diagnostics = staticAnalyzer.analyze(query, queryArgumentType);
    return diagnostics;
}