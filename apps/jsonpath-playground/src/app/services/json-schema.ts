import Ajv from "ajv/dist/2020";
import jsonSchemaSchema from "../json-schemas/json-schema.schema.json";
import jsonTypeDefinitionSchema from "../json-schemas/json-type-definition.schema.json";
import { JSONSchema } from "@jsonpath-tools/jsonpath";
import { JSONTypeDefinition } from "@jsonpath-tools/jsonpath";

/**
 * Checks whether the given JSON Schema is valid.
 * @param jsonSchema JSON Schema.
 */
export function isValidJSONSchema(jsonSchema: any): jsonSchema is JSONSchema {
    return jsonSchemaValidator(jsonSchema);
}

/**
 * Checks whether the given JSON Type Definition is valid.
 * @param jsonSchema JSON Type Definition.
 */
export function isValidJSONTypeDefinition(jsonTypeDefinition: any): jsonTypeDefinition is JSONTypeDefinition {
    return jsonTypeDefinitionValidator(jsonTypeDefinition);
}

const ajv = new Ajv();
const jsonSchemaValidator = ajv.compile<JSONSchema>(jsonSchemaSchema);
const jsonTypeDefinitionValidator = ajv.compile<JSONTypeDefinition>(jsonTypeDefinitionSchema);