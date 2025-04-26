import { describe, it } from "vitest";

export const jsonTypeDefinitionForTest = `{
  "properties": {
    "id": { "type": "string" },
    "createdAt": { "type": "timestamp" },
    "karma": { "type": "int32" },
    "isAdmin": { "type": "boolean" }
  }
}`;

describe("JSON Type Definition", () => {
    it("JSON Type Definition to Type", () => {
        /*const type = jsonTypeDefinitionToType(JSON.parse(jsonTypeDefinitionForTest));
        const typeText = type.toString();
        console.log(typeText);*/
    });
});