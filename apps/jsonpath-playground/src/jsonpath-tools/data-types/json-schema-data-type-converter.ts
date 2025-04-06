import { JSONValue } from "../json/json-types";
import { AnyDataType, ArrayDataType, LiteralDataType, NeverDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, DataType, DataTypeAnnotation, UnionDataType } from "./data-types";
import { intersectTypes, subtractTypes } from "./operations";
import { get } from "jsonpointer";
import { normalize, parse, resolve, serialize } from "uri-js";

/**
 * Converts the given JSON Schema to a data type.
 * @param jsonSchema JSON schema with its URI (optional).
 * @param additionalJSONSchemas Additional JSON Schemas that can be referenced from the {@link jsonSchema} (via `$ref`).
 */
export function jsonSchemaToType(jsonSchema: JsonSchemaWithURI, additionalJSONSchemas: JsonSchemaWithURI[] = []): DataType {
    const context = new JSONSchemaDataTypeConverterContext(jsonSchema, additionalJSONSchemas);
    return context.jsonSchemaToType(jsonSchema.schema);
}

class JSONSchemaDataTypeConverterContext {
    private readonly visitedSchemas = new Map<JSONSchema, DataType>();
    private readonly notExactSchemas: Set<JSONSchema> = new Set();
    private readonly previousSchemas: Set<JSONSchema> = new Set();
    private readonly schemaURIToSchema = new Map<string, JSONSchema>();
    private readonly schemaToBaseURI = new Map<JSONSchema, string>();

    constructor(jsonSchema: JsonSchemaWithURI, additionalJsonSchemas: JsonSchemaWithURI[]) {
        this.indexSchemaWithURI(jsonSchema);
        for (const additionalJSONSchema of additionalJsonSchemas)
            this.indexSchemaWithURI(additionalJSONSchema);
    }

    jsonSchemaToType(jsonSchema: JSONSchema): DataType {
        if (jsonSchema === true)
            return AnyDataType.create();
        if (jsonSchema === false)
            return NeverDataType.create();

        const fromCache = this.visitedSchemas.get(jsonSchema);
        if (fromCache !== undefined) {
            if (this.notExactSchemas.has(jsonSchema) || this.previousSchemas.has(jsonSchema))
                this.setNotExact();
            return fromCache;
        }
        
        this.previousSchemas.add(jsonSchema);
        const typeAnnotation = this.createTypeAnnotation(jsonSchema);
        const typeAnnotations = typeAnnotation !== null ? new Set([typeAnnotation]) : DataTypeAnnotation.EMPTY_SET;
        this.visitedSchemas.set(jsonSchema, AnyDataType.create(typeAnnotations));

        const types = [
            this.createNullType(jsonSchema),
            this.createBooleanType(jsonSchema),
            this.createStringType(jsonSchema),
            this.createNumberType(jsonSchema),
            this.createObjectType(jsonSchema),
            this.createArrayType(jsonSchema)
        ];

        const basicTypes = UnionDataType.create(types);

        const additionalConstraintTypes = [
            basicTypes,
            this.createEnumType(jsonSchema),
            this.createConstType(jsonSchema),
            this.createAllOfType(jsonSchema),
            this.createAnyOfType(jsonSchema),
            this.createOneOfType(jsonSchema),
            this.createRefType(jsonSchema)
        ];
        const notType = this.createNotType(jsonSchema);

        const additionalConstraints = additionalConstraintTypes.reduce((a, b) => intersectTypes(a, b));
        let resultType = subtractTypes(additionalConstraints, notType);
        resultType = resultType.addAnnotations(typeAnnotations);

        if (!this.hasOnlyFullySupportedKeywords(jsonSchema))
            this.setNotExact();
        this.visitedSchemas.set(jsonSchema, resultType);
        this.previousSchemas.delete(jsonSchema);
        return resultType;
    }

    private createNullType(jsonSchema: ObjectJSONSchema) {
        if (!this.isTypePermittedByTypeConstraint("null", jsonSchema))
            return NeverDataType.create();
        return PrimitiveDataType.create(PrimitiveDataTypeType.null);
    }

    private createBooleanType(jsonSchema: ObjectJSONSchema) {
        if (!this.isTypePermittedByTypeConstraint("boolean", jsonSchema))
            return NeverDataType.create();
        return PrimitiveDataType.create(PrimitiveDataTypeType.boolean);
    }

    private createStringType(jsonSchema: ObjectJSONSchema) {
        if (!this.isTypePermittedByTypeConstraint("string", jsonSchema))
            return NeverDataType.create();
        return PrimitiveDataType.create(PrimitiveDataTypeType.string);
    }

    private createNumberType(jsonSchema: ObjectJSONSchema) {
        if (!this.isTypePermittedByTypeConstraint("number", jsonSchema) && !this.isTypePermittedByTypeConstraint("integer", jsonSchema))
            return NeverDataType.create();
        if (this.isTypePermittedByTypeConstraint("integer", jsonSchema) && !this.isTypePermittedByTypeConstraint("number", jsonSchema))
            this.setNotExact();
        return PrimitiveDataType.create(PrimitiveDataTypeType.number);
    }

    private createObjectType(jsonSchema: ObjectJSONSchema) {
        if (!this.isTypePermittedByTypeConstraint("object", jsonSchema))
            return NeverDataType.create();

        const properties = new Map<string, DataType>();
        if (jsonSchema.properties !== undefined) {
            for (const [key, value] of Object.entries(jsonSchema.properties))
                properties.set(key, this.jsonSchemaToType(value));
        }

        const restProperties = jsonSchema.additionalProperties === undefined ? AnyDataType.create() : this.jsonSchemaToType(jsonSchema.additionalProperties);
        const requiredProperties = jsonSchema.required === undefined ? new Set<string>() : new Set<string>(jsonSchema.required);
        return ObjectDataType.create(properties, restProperties, requiredProperties);
    }

    private createArrayType(jsonSchema: ObjectJSONSchema) {
        if (!this.isTypePermittedByTypeConstraint("array", jsonSchema))
            return NeverDataType.create();

        const prefixElementTypes: DataType[] = jsonSchema.prefixItems !== undefined
            ? jsonSchema.prefixItems.map(v => this.jsonSchemaToType(v))
            : [];
        const restElementType = jsonSchema.items !== undefined
            ? this.jsonSchemaToType(jsonSchema.items)
            : AnyDataType.create();

        const requiredElementsCount = jsonSchema.minItems === undefined ? 0 : jsonSchema.minItems as number;
        return ArrayDataType.create(prefixElementTypes, restElementType, requiredElementsCount);
    }

    private createEnumType(jsonSchema: ObjectJSONSchema) {
        if (jsonSchema.enum === undefined)
            return AnyDataType.create();
        const types = jsonSchema.enum.map(v => this.createConstantType(v));
        return UnionDataType.create(types);
    }

    private createConstType(jsonSchema: ObjectJSONSchema) {
        if (jsonSchema.const === undefined)
            return AnyDataType.create();
        return this.createConstantType(jsonSchema.const);
    }

    private createAllOfType(jsonSchema: ObjectJSONSchema) {
        if (jsonSchema.allOf === undefined)
            return AnyDataType.create();
        const types = jsonSchema.allOf.map(v => this.jsonSchemaToType(v));
        return types.reduce(intersectTypes, AnyDataType.create());
    }

    private createAnyOfType(jsonSchema: ObjectJSONSchema) {
        if (jsonSchema.anyOf === undefined)
            return AnyDataType.create();
        const types = jsonSchema.anyOf.map(v => this.jsonSchemaToType(v));
        return UnionDataType.create(types);
    }

    private createOneOfType(jsonSchema: ObjectJSONSchema) {
        if (jsonSchema.oneOf === undefined)
            return AnyDataType.create();
        const types = jsonSchema.oneOf.map(v => this.jsonSchemaToType(v));
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < types.length; j++) {
                if (i !== j && !this.notExactSchemas.has(jsonSchema.oneOf[j]))
                    types[i] = subtractTypes(types[i], types[j]);
            }
        }
        return UnionDataType.create(types);
    }

    private createNotType(jsonSchema: ObjectJSONSchema) {
        if (jsonSchema.not === undefined)
            return NeverDataType.create();
        const notType = this.jsonSchemaToType(jsonSchema.not);
        return this.notExactSchemas.has(jsonSchema.not) ? NeverDataType.create() : notType;
    }

    private createRefType(jsonSchema: ObjectJSONSchema) {
        if (jsonSchema.$ref === undefined)
            return AnyDataType.create();

        const baseURI = this.schemaToBaseURI.get(jsonSchema);
        if (baseURI === undefined)
            return AnyDataType.create();
        
        const resolvedURI = parse(resolve(baseURI, jsonSchema.$ref));
        if (resolvedURI.error !== undefined)
            return AnyDataType.create();
        let jsonPointer = "/";
        if (resolvedURI.fragment !== undefined && resolvedURI.fragment.startsWith("/")) {
            jsonPointer = decodeURIComponent(resolvedURI.fragment);
            resolvedURI.fragment = undefined;
        }
        const schemaURI = normalize(serialize(resolvedURI));
        const schemaAtURI = this.schemaURIToSchema.get(schemaURI);
        if (schemaAtURI === undefined)
            return AnyDataType.create();

        const referencedSchema = get(schemaAtURI, jsonPointer);
        if (referencedSchema === undefined)
            return AnyDataType.create();

        return this.jsonSchemaToType(referencedSchema);
    }

    private createConstantType(value: JSONValue): DataType {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
            return LiteralDataType.create(value);
        else if (value === null)
            return PrimitiveDataType.create(PrimitiveDataTypeType.null);
        else if (Array.isArray(value))
            return this.createArrayConstantType(value);
        else
            return this.createObjectConstantType(value);
    }

    private createObjectConstantType(value: { [key: string]: JSONValue }): DataType {
        const propertyTypes = new Map(Object.entries(value).map(([pn, pv]) => [pn, this.createConstantType(pv)]));
        const requiredProperties = new Set(Object.keys(value));
        return ObjectDataType.create(propertyTypes, NeverDataType.create(), requiredProperties);
    }

    private createArrayConstantType(value: JSONValue[]): DataType {
        const prefixElementTypes = value.map(v => this.createConstantType(v));
        return ArrayDataType.create(prefixElementTypes, NeverDataType.create(), prefixElementTypes.length);
    }

    private createTypeAnnotation(jsonSchema: ObjectJSONSchema): DataTypeAnnotation | null {
        const title = jsonSchema.title;
        const description = jsonSchema.description;
        const readOnly = jsonSchema.readOnly;
        const writeOnly = jsonSchema.writeOnly;
        const deprecated = jsonSchema.deprecated;
        const defaultValue = jsonSchema.default;
        const exampleValues = jsonSchema.examples;
        if (title === undefined && description === undefined && readOnly === undefined && writeOnly === undefined && deprecated === undefined && defaultValue === undefined && exampleValues === undefined)
            return null;
        return new DataTypeAnnotation(
            title ?? "",
            description ?? "",
            deprecated ?? false,
            readOnly ?? false,
            writeOnly ?? false,
            defaultValue ?? undefined,
            exampleValues ?? []
        );
    }

    private isTypePermittedByTypeConstraint(type: string, jsonSchema: ObjectJSONSchema): boolean {
        const typeConstraint = jsonSchema.type;
        return typeConstraint === undefined || typeConstraint === type || Array.isArray(typeConstraint) && typeConstraint.includes(type);
    }

    private hasOnlyFullySupportedKeywords(jsonSchema: ObjectJSONSchema) {
        for (const property in jsonSchema) {
            if (!fullySupportedKeywords.has(property))
                return false;
        }
        return true;
    }

    private setNotExact() {
        for (const schema of this.previousSchemas) {
            this.notExactSchemas.add(schema)
        }
    }

    private indexSchemaWithURI(jsonSchemaWithURI: JsonSchemaWithURI) {
        const baseURI = jsonSchemaWithURI.uri ?? "/";
        this.schemaURIToSchema.set(baseURI, jsonSchemaWithURI.schema);
        this.indexSchema(jsonSchemaWithURI.schema, baseURI);
    }

    private indexSchema(jsonSchema: JSONSchema, baseURI: string) {
        if (typeof jsonSchema === "boolean") 
            return;
        if (jsonSchema.$id !== undefined) {
            const resolvedURI = parse(resolve(baseURI, jsonSchema.$id));
            if (resolvedURI.error === undefined) {
                const resolvedURIString = normalize(serialize(resolvedURI));
                this.schemaURIToSchema.set(resolvedURIString, jsonSchema);
                baseURI = resolvedURIString;
            }
        }
        if (jsonSchema.$anchor !== undefined) {
            const anchorURI = parse(baseURI);
            if (anchorURI.error === undefined) {
                anchorURI.fragment = jsonSchema.$anchor;
                this.schemaURIToSchema.set(normalize(serialize(anchorURI)), jsonSchema);
            }
        }
        this.schemaToBaseURI.set(jsonSchema, baseURI);

        if (jsonSchema.anyOf !== undefined) {
            for (const child of jsonSchema.anyOf) this.indexSchema(child, baseURI);
        }
        if (jsonSchema.allOf !== undefined) {
            for (const child of jsonSchema.allOf) this.indexSchema(child, baseURI);
        }
        if (jsonSchema.oneOf !== undefined) {
            for (const child of jsonSchema.oneOf) this.indexSchema(child, baseURI);
        }
        if (jsonSchema.not !== undefined) this.indexSchema(jsonSchema.not, baseURI);
        if (jsonSchema.properties !== undefined) {
            for (const child of Object.values(jsonSchema.properties)) this.indexSchema(child, baseURI);
        }
        if (jsonSchema.$defs !== undefined) {
            for (const child of Object.values(jsonSchema.$defs)) this.indexSchema(child, baseURI);
        }
        if (jsonSchema.additionalProperties !== undefined) this.indexSchema(jsonSchema.additionalProperties, baseURI);
        if (jsonSchema.prefixItems !== undefined) {
            for (const child of jsonSchema.prefixItems) this.indexSchema(child, baseURI);
        }
        if (jsonSchema.items !== undefined) this.indexSchema(jsonSchema.items, baseURI);
    }
}

const fullySupportedKeywords: ReadonlySet<string> = new Set([
    "type",
    "enum",
    "const",
    "anyOf",
    "allOf",
    "properties",
    "additionalProperties",
    "required",
    "prefixItems",
    "items",
    "minItems",
    "title",
    "description",
    "deprecated",
    "readOnly",
    "writeOnly",
    "default",
    "examples",
    "$comment",
    "$schema",
    "$defs",
    "$id",
    "$anchor"
]);

export interface JsonSchemaWithURI {
    readonly schema: JSONSchema;
    readonly uri?: string;
}

export type JSONSchema = boolean | ObjectJSONSchema;

export interface ObjectJSONSchema {
    readonly type?: JSONSchemaType | readonly JSONSchemaType[];
    readonly enum?: JSONValue[];
    readonly const?: JSONValue;
    readonly anyOf?: readonly JSONSchema[];
    readonly allOf?: readonly JSONSchema[];
    readonly oneOf?: readonly JSONSchema[];
    readonly not?: JSONSchema;
    readonly properties?: JSONSchemaDictionary;
    readonly additionalProperties?: JSONSchema;
    readonly required?: readonly string[];
    readonly prefixItems?: readonly JSONSchema[];
    readonly items?: JSONSchema;
    readonly minItems?: number;
    readonly title?: string;
    readonly description?: string;
    readonly deprecated?: boolean;
    readonly readOnly?: boolean;
    readonly writeOnly?: boolean;
    readonly default?: JSONValue;
    readonly examples?: readonly JSONValue[];
    readonly $comment?: string;
    readonly $schema?: string;
    readonly $defs?: JSONSchemaDictionary;
    readonly $id?: string;
    readonly $anchor?: string;
    readonly $ref?: string;
}
export type JSONSchemaDictionary = { readonly [key: string]: JSONSchema };
export type JSONSchemaType = "null" | "boolean" | "string" | "number" | "integer" | "array" | "object";