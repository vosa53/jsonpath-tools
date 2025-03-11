import { describe, expect, it } from "vitest";
import { AnyType, ArrayType, intersectTypes, LiteralType, NeverType, ObjectType, PrimitiveType, PrimitiveTypeType, UnionType } from "./types";
import { JSONPathParser } from "../../syntax-analysis/parser";
import { TypeAnalyzer } from "./type-analyzer";
import { schemaToType } from "./type-schema-converter";
import { jsonSchemaForTest } from "./type-schema-converter.spec";

describe("Types", () => {
    it("types test", () => {
        const rootType = schemaToType(JSON.parse(jsonSchemaForTest));
        const typeAnalyzer = new TypeAnalyzer(rootType);
        const parser = new JSONPathParser();
        const path = parser.parse("$[?@.role=='admin']");

        const queryType = typeAnalyzer.getType(path.query);
        console.log(rootType.toString());
        console.log(queryType.toString());
        //expect(queryType.toString()).toBe("\"pes\"");
    });
});