import { describe, expect, it } from "vitest";
import { jsonTypeDefinitionToType } from "./json-type-definition-data-type-converter";

describe("JSON Type Definition data type converter", () => {
    it("jsonTypeDefinitionToType - Basic case", () => {
        const dataType = jsonTypeDefinitionToType(jsonTypeDefinition);
        expect(dataType.toString(false, true)).toBe(`{
  coordinates: [...: number],
  city?: string,
  state?: string,
  zip?: string
}`);
    });
});

const jsonTypeDefinition = JSON.parse(`{
    "definitions": {
        "gcsCoordinates": {
            "metadata": "Geographic Coordinate System coordinates (latitude and longtitude)",
            "elements": {
                "metadata": "Latitude/Longtitude of the GCS coordinates",
                "type": "float64"
            }
        }
    },
    "metadata": "Physical location of the dealership",
    "optionalProperties": {
        "city": {
            "metadata": "City where the dealership is located",
            "type": "string"
        },
        "state": {
            "metadata": "State abbreviation (e.g., CA, NY)",
            "type": "string"
        },
        "zip": {
            "metadata": "5-digit postal ZIP code",
            "type": "string"
        }
    },
    "properties": {
        "coordinates": {
            "ref": "gcsCoordinates"
        }
    }
}`);