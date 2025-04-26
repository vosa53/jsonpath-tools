import { describe, it } from "vitest";
import { EditorService } from "./editor-service";

describe("Editor service", () => {
    it("End-to-end test", () => {
        const editorService = new EditorService();
        editorService.updateQuery("$.");
        // TODO
    });
});

