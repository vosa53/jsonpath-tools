import { describe, expect, it } from "vitest";
import { parseQueryAndPosition } from "../helpers/test-utils";
import { testQueryOptions } from "../helpers/test-utils";
import { TextRange } from "../text/text-range";
import { DocumentHighlight, DocumentHighlightsService } from "./document-highlights-service";

describe("Document highlights service", () => {
    it("provideHighlights - Highlights a root identifier", () => {
        expect(provideHighlights(`|$.aa.bb[?$.cc]`)).toEqual([
            new DocumentHighlight(new TextRange(0, 1)),
            new DocumentHighlight(new TextRange(9, 1))
        ]);
    });

    it("provideHighlights - Highlights a current identifier and a question mark token from a corresponding filter selector (caret at a current identifier)", () => {
        expect(provideHighlights(`$.aa.bb[?@|.cc && @.dd[?@.ee]]`)).toEqual([
            new DocumentHighlight(new TextRange(8, 1)),
            new DocumentHighlight(new TextRange(9, 1)),
            new DocumentHighlight(new TextRange(17, 1))
        ]);
    });

    it("provideHighlights - Highlights a current identifier and a question mark token from a corresponding filter selector (caret at a question mark token)", () => {
        expect(provideHighlights(`$.aa.bb[|?@.cc && @.dd[?@.ee]]`)).toEqual([
            new DocumentHighlight(new TextRange(8, 1)),
            new DocumentHighlight(new TextRange(9, 1)),
            new DocumentHighlight(new TextRange(17, 1))
        ]);
    });

    it("provideHighlights - Highlights same functions", () => {
        expect(provideHighlights(`$.aa.bb[?fo|o() && bar()][?foo()]`)).toEqual([
            new DocumentHighlight(new TextRange(9, 3)),
            new DocumentHighlight(new TextRange(26, 3))
        ]);
    });

    it("provideHighlights - Not existing function is not highlighted", () => {
        expect(provideHighlights(`$.aa.bb[?ab|c() && bar()]`)).toEqual([]);
    });
});

function provideHighlights(queryText: string): DocumentHighlight[] {
    const { query, position } = parseQueryAndPosition(queryText);
    const documentHighlightsService = new DocumentHighlightsService(testQueryOptions);
    const highlights = documentHighlightsService.provideHighlights(query, position);
    return highlights;
}
