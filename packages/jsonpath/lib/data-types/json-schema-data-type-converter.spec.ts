import { describe, expect, it } from "vitest";
import { jsonSchemaToType } from "./json-schema-data-type-converter";

describe("JSON Schema data type converter", () => {
    it("jsonSchemaToType - Basic case", () => {
        const dataType = jsonSchemaToType({ schema: jsonSchema });
        expect(dataType.toString(false, true)).toBe(`{
  city?: string,
  state?: "CZ" | "SK" | "DE",
  zip?: string,
  coordinates: [number, number]
}`)
    });
});

const jsonSchema = JSON.parse(`{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$defs": {
        "gcsCoordinates": {
            "title": "GCS Coordinates",
            "description": "Geographic Coordinate System coordinates (latitude and longtitude)",
            "type": "array",
            "prefixItems": [
                {
                    "title": "Latitude",
                    "description": "Latitude of the GCS coordinates",
                    "type": "number"
                },
                {
                    "title": "Longtitude",
                    "description": "Longtitude of the GCS coordinates",
                    "type": "number"
                }
            ],
            "items": false,
            "minItems": 2
        }
    },
    "title": "Location",
    "description": "Physical location of the dealership",
    "type": "object",
    "properties": {
        "city": {
            "title": "City",
            "description": "City where the dealership is located",
            "type": "string"
        },
        "state": {
            "title": "State",
            "description": "State abbreviation (e.g., CA, NY)",
            "enum": [
                "CZ",
                "SK",
                "DE"
            ],
            "minLength": 2,
            "maxLength": 2
        },
        "zip": {
            "title": "ZIP Code",
            "description": "5-digit postal ZIP code",
            "type": "string",
            "pattern": "^[0-9]{5}$"
        },
        "coordinates": {
            "$ref": "#/$defs/gcsCoordinates"
        }
    },
    "required": [
        "coordinates"
    ],
    "additionalProperties": false
}`);