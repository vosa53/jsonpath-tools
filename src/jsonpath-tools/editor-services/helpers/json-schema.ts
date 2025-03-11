import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { Draft2019, isJsonError, SchemaNode } from "json-schema-library";
import { Type } from "./types";
import { schemaToType } from "./type-schema-converter";
import { RawJSONSchema } from "./raw-json-schema";

export class JsonSchema {
    static create(schema: RawJSONSchema) {
        const draft = new Draft2019();
        // TODO
        // @ts-ignore
        const node = draft.createNode(schema);
        const rootType = schemaToType(schema);
        return new JsonSchema(node, rootType);
    }

    private constructor(
        private readonly node: SchemaNode,
        readonly rootType: Type
    ) {

    }

    step(property: string | number, data: JSONPathJSONValue): JsonSchema | null {
        const childNode = this.node.draft.step(this.node, property, data);
        if (isJsonError(childNode)) 
            return null;
        else 
            return new JsonSchema(childNode, this.rootType);
    }

    get schema(): JSONPathJSONValue {
        return this.node.schema;
    }
}