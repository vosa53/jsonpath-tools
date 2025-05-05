import { describe, it, expect } from "vitest";
import { Diagnostics, DiagnosticsSeverity } from "./diagnostics";
import { TextRange } from "./text/text-range";

describe("Diagnostics", () => {
    it("toString - Converts the diagnostics to a text representation", () => {
        const diagnostics = new Diagnostics(DiagnosticsSeverity.warning, "Some warning message.", new TextRange(5, 10))
        expect(diagnostics.toString()).toBe("Warning at 5:10: Some warning message.");
    });
});