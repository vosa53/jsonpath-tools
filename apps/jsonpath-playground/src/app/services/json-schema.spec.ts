import { describe, expect, it } from "vitest";
import { examples } from "../models/examples";
import { isValidJSONSchema, isValidJSONTypeDefinition } from "./json-schema";

describe("JSON Schema", () => {
    it("isValidJSONSchema - Returns true for a valid JSON Schema", () => {
        expect(isValidJSONSchema(JSON.parse(examples[0].jsonSchemaText))).toBeTruthy();
    });

    it("isValidJSONSchema - Returns false for an invalid JSON Schema", () => {
        expect(isValidJSONSchema(invalidJSONSchema)).toBeFalsy();
    });

    it("isValidJSONTypeDefinition - Returns true for a valid JSON Type Definition", () => {
        expect(isValidJSONTypeDefinition(JSON.parse(examples[0].jsonTypeDefinitionText))).toBeTruthy();
    });

    it("isValidJSONTypeDefinition - Returns false for an invalid JSON Type Definition", () => {
        expect(isValidJSONTypeDefinition(invalidJSONTypeDefinition)).toBeFalsy();
    });
});

const invalidJSONSchema = {
    type: "object",
    properties: {
        invalid: { type: "something" }
    }
};

const invalidJSONTypeDefinition = {
    properties: {
        invalid: { type: "something" }
    }
};