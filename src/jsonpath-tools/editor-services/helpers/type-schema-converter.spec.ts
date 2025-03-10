import { describe, expect, it } from "vitest";
import { AnyType, ArrayType, intersectTypes, LiteralType, NeverType, ObjectType, PrimitiveType, PrimitiveTypeType, UnionType } from "./types";
import { JSONPathParser } from "../../syntax-analysis/parser";
import { TypeAnalyzer } from "./type-analyzer";
import { schemaToType } from "./type-schema-converter";

const jsonSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "role": {
      "type": "string",
      "enum": ["admin", "guest"]
    },
    "userName": {
      "type": "string"
    },
    "bannedCount": {
      "type": "integer",
      "minimum": 0
    }
  },
  "required": ["role", "userName"],
  "oneOf": [
    {
      "properties": {
        "role": { "enum": ["admin"] },
        "bannedCount": { "type": "integer" }
      },
      "required": ["bannedCount"]
    },
    {
      "properties": {
        "role": { "enum": ["guest"] }
      },
      "not": {
        "required": ["bannedCount"]
      }
    }
  ]
}`;

describe("Type schema converter", () => {
    it("types test", () => {
        const type = schemaToType(JSON.parse(jsonSchema));
        const typeText = type.toString();
        console.log(typeText);
    });
});