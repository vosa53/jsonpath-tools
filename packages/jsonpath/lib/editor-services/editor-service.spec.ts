import { describe, expect, it } from "vitest";
import { ArrayDataType, NeverDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, UnionDataType } from "../data-types/data-types";
import { Diagnostics, DiagnosticsSeverity } from "../diagnostics";
import { defaultQueryOptions } from "../query-options";
import { TextChange } from "../text/text-change";
import { TextRange } from "../text/text-range";
import { CompletionItem, CompletionItemType } from "./completion-service";
import { EditorService } from "./editor-service";

describe("Editor service", () => {
    it("End-to-end test", () => {
        const editorService = new EditorService();

        editorService.updateQuery("  $.books[?@.author != null]");
        editorService.updateQueryOptions(defaultQueryOptions);
        editorService.updateQueryArgument(queryArgument);
        editorService.updateQueryArgumentType(queryArgumentType);

        const diagnostics = editorService.getDiagnostics();
        expect(diagnostics).toEqual([
            new Diagnostics(DiagnosticsSeverity.error, expect.any(String), new TextRange(0, 2))
        ]);

        editorService.updateQueryPartial([new TextChange(new TextRange(28, 0), ".")]);

        const completionItems = editorService.getCompletions(29);
        expect(new Set(completionItems)).toEqual(new Set([
            new CompletionItem(CompletionItemType.syntax, `*`, new TextRange(29, 0), `*`, undefined, expect.any(Function)),
            new CompletionItem(CompletionItemType.name, `title`, new TextRange(29, 0), `title`, `string`, expect.any(Function)),
            new CompletionItem(CompletionItemType.name, `author`, new TextRange(29, 0), `author`, `string`, expect.any(Function))
        ]));
    });
});

const queryArgument = {
    books: [
        { title: "1984", author: "George Orwell" },
        { title: "Epic of Gilgamesh", author: null },
        { title: "The Old Man and the Sea", author: "Ernest Hemingway" }
    ]
};

const queryArgumentType = ObjectDataType.create(new Map([
    ["books", ArrayDataType.create([], ObjectDataType.create(new Map([
        ["title", PrimitiveDataType.create(PrimitiveDataTypeType.string)],
        ["author", UnionDataType.create([PrimitiveDataType.create(PrimitiveDataTypeType.string), PrimitiveDataType.create(PrimitiveDataTypeType.null)])]
    ]), NeverDataType.create(), new Set()), 0)]
]), NeverDataType.create(), new Set());