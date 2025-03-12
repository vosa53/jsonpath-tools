import { describe, expect, it } from "vitest";
import { AnyType, ArrayType, intersectTypes, LiteralType, NeverType, ObjectType, PrimitiveType, PrimitiveTypeType, UnionType } from "./types";
import { TypeAnalyzer } from "./type-analyzer";
import { jsonSchemaToType } from "./json-schema-to-type";
import { jsonSchemaForTest } from "./json-schema-to-type.spec";
import { JSONPathParser } from "../syntax-analysis/parser";

describe("Types", () => {
    it("types test", () => {
        const rootType = jsonSchemaToType(JSON.parse(jsonSchemaForTest));
        const typeAnalyzer = new TypeAnalyzer(rootType);
        const parser = new JSONPathParser();
        const path = parser.parse("$[?@.role=='admin']");

        const queryType = typeAnalyzer.getType(path.query);
        console.log(rootType.toString());
        console.log(queryType.toString());
        //expect(queryType.toString()).toBe("\"pes\"");
    });
});