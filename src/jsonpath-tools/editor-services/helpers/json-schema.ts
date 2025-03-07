import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { Draft, Draft2019, isJsonError, SchemaNode } from "json-schema-library";

export class JsonSchema {
    static create(schema: JSONPathJSONValue) {
        const draft = new Draft2019();
        // TODO
        // @ts-ignore
        const node = draft.createNode(schema);
        return new JsonSchema(node);
    }

    private constructor(private readonly node: SchemaNode) {

    }

    step(property: string | number, data: JSONPathJSONValue): JsonSchema | null {
        const childNode = this.node.draft.step(this.node, property, data);
        if (isJsonError(childNode)) 
            return null;
        else 
            return new JsonSchema(childNode);
    }

    get schema(): JSONPathJSONValue {
        return this.node.schema;
    }
}