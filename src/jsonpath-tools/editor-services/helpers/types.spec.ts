import { describe, expect, it } from "vitest";
import { AnyType, ArrayType, intersectTypes, LiteralType, NeverType, ObjectType, PrimitiveType, PrimitiveTypeType, UnionType } from "./types";
import { JSONPathParser } from "../../syntax-analysis/parser";
import { TypeAnalyzer } from "./type-analyzer";

describe("Types", () => {
    it("types test", () => {
        return;
        const rootType = new ObjectType(new Map([
            ["abc", new ArrayType([], new UnionType([
                new ObjectType(new Map([
                    ["type", new LiteralType("admin")],
                ]), AnyType.instance),
                new ObjectType(new Map([
                    ["type", new LiteralType("user")],
                ]), AnyType.instance)
            ]))],
        ]), AnyType.instance);
        const typeAnalyzer = new TypeAnalyzer(rootType);
        const parser = new JSONPathParser();
        const path = parser.parse("$.abc[?@.type!='user']");
        const lastSegment = path.query.segments[path.query.segments.length - 1];
        const type = typeAnalyzer.getType(lastSegment);
        expect(type.toString()).toBe("\"pes\"");
    });
});