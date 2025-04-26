import { describe, it, expect } from "vitest";
import { Parser } from "../syntax-analysis/parser";
import { FormattingService } from "./formatting-service";
import { applyTextChanges } from "../text/operations";

describe("Formatting service", () => {
    it("getFormattingEdits - Segments should not have a space between them", () => {
        expect(format(`$  .aa ["bb"].cc`)).toBe(`$.aa["bb"].cc`);
    });

    it("getFormattingEdits - Comparison operator is surrounded by one space from each side", () => {
        expect(format(`$.aa[?@.bb  >5]`)).toBe(`$.aa[?@.bb > 5]`);
    });

    it("getFormattingEdits - Binary logic operator is surrounded by one space from each side", () => {
        expect(format(`$.aa[?@.bb  &&@.cc]`)).toBe(`$.aa[?@.bb && @.cc]`);
        expect(format(`$.aa[?@.bb  ||@.cc]`)).toBe(`$.aa[?@.bb || @.cc]`);
    });
});

function format(queryText: string): string {
    const parser = new Parser();
    const query = parser.parse(queryText);
    const formattingService = new FormattingService();
    const edits = formattingService.provideFormattingEdits(query);
    const formattedText = applyTextChanges(queryText, edits);
    return formattedText;
}