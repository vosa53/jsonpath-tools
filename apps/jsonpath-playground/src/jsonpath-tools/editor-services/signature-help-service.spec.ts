import { describe, expect, it } from "vitest";
import { parseQueryAndPosition } from "../helpers/test-utils";
import { testQueryOptions } from "../helpers/test-utils";
import { TextRange } from "../text/text-range";
import { Signature, SignatureHelpService, SignatureParameter } from "./signature-help-service";

describe("Signature help service", () => {
    it("provideSignature - Returns null outside of a function paranthesis", () => {
        expect(provideSignature(`$.a|a.bb[?foo()]`)).toEqual(null);
        expect(provideSignature(`$.aa.bb[?f|oo()]`)).toEqual(null);
        expect(provideSignature(`$.aa.bb[?foo|()]`)).toEqual(null);
        expect(provideSignature(`$.aa.bb[?foo()|]`)).toEqual(null);
    });

    it("provideSignature - Returns function signature inside of a function paranthesis", () => {
        expect(provideSignature(`$.aa.bb[?foo(|)]`)).toEqual(new Signature(`foo(abc: ValueType, def: NodesType): LogicalType`, [
            new SignatureParameter(new TextRange(4, 14), "Lorem impsum"),
            new SignatureParameter(new TextRange(20, 14), "Lorem impsum")
        ], 0, "Lorem impsum"));
    });

    it("provideSignature - Returns the most inner function signature for nested functions", () => {
        expect(provideSignature(`$.aa.bb[?foo(bar(|))]`)).toEqual(new Signature(`bar(abc: ValueType): ValueType`, [
            new SignatureParameter(new TextRange(4, 14), "Lorem impsum")
        ], 0, "Lorem impsum"));
    });

    it("provideSignature - Returns correct active parameter index", () => {
        expect(provideSignature(`$.aa.bb[?foo(|)]`)!.activeParameterIndex).toBe(0);
        expect(provideSignature(`$.aa.bb[?foo(@,|)]`)!.activeParameterIndex).toBe(1);
        expect(provideSignature(`$.aa.bb[?foo(,,|)]`)!.activeParameterIndex).toBe(2);
        expect(provideSignature(`$.aa.bb[?foo(@, b|ar())]`)!.activeParameterIndex).toBe(1);
    });
});

function provideSignature(queryText: string): Signature | null {
    const { query, position } = parseQueryAndPosition(queryText);
    const signatureHelpService = new SignatureHelpService(testQueryOptions);
    const signature = signatureHelpService.provideSignature(query, position);
    return signature;
}
