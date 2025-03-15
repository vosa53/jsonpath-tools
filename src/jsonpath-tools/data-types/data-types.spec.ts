import { describe, expect, it } from "vitest";
import { AnyDataType, ArrayDataType, intersectTypes, LiteralDataType, NeverDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, UnionDataType } from "./data-types";
import { DataTypeAnalyzer } from "./data-type-analyzer";
import { jsonSchemaToType } from "./json-schema-data-type-converter";
import { jsonSchemaForTest } from "./json-schema-data-type-converter.spec";
import { JSONPathParser } from "../syntax-analysis/parser";
import { defaultJSONPathOptions } from "../options";

describe("Types", () => {
    it("types test", () => {
        const rootType = jsonSchemaToType(JSON.parse(jsonSchemaForTest));
        const typeAnalyzer = new DataTypeAnalyzer(rootType, defaultJSONPathOptions);
        const parser = new JSONPathParser();
        const path = parser.parse("$[?@.role=='admin']");

        const queryType = typeAnalyzer.getType(path.query);
        console.log(rootType.toString());
        console.log(queryType.toString());
        //expect(queryType.toString()).toBe("\"pes\"");
    });
});