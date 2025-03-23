import Ajv from "ajv/dist/2020";
import jsonSchemaSchema from "./json-schema.schema.json";
import jsonTypeDefinitionSchema from "./json-type-definition.schema.json";
import { JSONSchema } from "@/jsonpath-tools/data-types/json-schema-data-type-converter";
import { JSONTypeDefinition } from "@/jsonpath-tools/data-types/json-type-definition-data-type-converter";

export function isValidJSONSchema(jsonSchema: any): jsonSchema is JSONSchema {
    return jsonSchemaValidator(jsonSchema);
}

export function isValidJSONTypeDefinition(jsonTypeDefinition: any): jsonTypeDefinition is JSONTypeDefinition {
    return jsonTypeDefinitionValidator(jsonTypeDefinition);
}

const ajv = new Ajv();
const jsonSchemaValidator = ajv.compile<JSONSchema>(jsonSchemaSchema);
const jsonTypeDefinitionValidator = ajv.compile<JSONTypeDefinition>(jsonTypeDefinitionSchema);