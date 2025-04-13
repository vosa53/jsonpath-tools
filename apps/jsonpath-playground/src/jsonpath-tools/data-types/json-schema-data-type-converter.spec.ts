import { describe, it } from "vitest";

export const jsonSchemaForTest = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
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
  }
}`;

describe("Type schema converter", () => {
    it("type schema converter test", () => {
        /*const type = jsonSchemaToType(JSON.parse(jsonSchemaForTest));
        const typeText = type.toString();
        console.log(typeText);*/
    });
});