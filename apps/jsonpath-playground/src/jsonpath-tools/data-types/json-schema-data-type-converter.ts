import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { AnyDataType, ArrayDataType, intersectTypes, LiteralDataType, NeverDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, subtractTypes, DataType, DataTypeAnnotation, UnionDataType } from "./data-types";

export function jsonSchemaToType(jsonSchema: any): DataType {
    const context = new JSONSchemaDataTypeConverterContext(
        jsonSchema
    );
    return context.jsonSchemaToType(jsonSchema);
}

class JSONSchemaDataTypeConverterContext {
    private readonly visitedSchemas = new Map<JSONPathJSONValue, DataType>();
    private readonly notExactSchemas: Set<JSONPathJSONValue> = new Set();
    private readonly previousSchemas: Set<JSONPathJSONValue> = new Set();

    constructor(
        readonly rootSchema: JSONPathJSONValue
    ) { }

    jsonSchemaToType(jsonSchema: any): DataType {
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

        if (jsonSchema === true)
            return AnyDataType.create();
        if (jsonSchema === false)
            return NeverDataType.create();
        if (typeof jsonSchema !== "object")
            return NeverDataType.create();

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

    private createNullType(jsonSchema: ObjectJsonSchema) {
        if (!this.isTypePermittedByTypeConstraint("null", jsonSchema))
            return NeverDataType.create();
        return PrimitiveDataType.create(PrimitiveDataTypeType.null);
    }

    private createBooleanType(jsonSchema: ObjectJsonSchema) {
        if (!this.isTypePermittedByTypeConstraint("boolean", jsonSchema))
            return NeverDataType.create();
        return PrimitiveDataType.create(PrimitiveDataTypeType.boolean);
    }

    private createStringType(jsonSchema: ObjectJsonSchema) {
        if (!this.isTypePermittedByTypeConstraint("string", jsonSchema))
            return NeverDataType.create();
        return PrimitiveDataType.create(PrimitiveDataTypeType.string);
    }

    private createNumberType(jsonSchema: ObjectJsonSchema) {
        if (!this.isTypePermittedByTypeConstraint("number", jsonSchema) && !this.isTypePermittedByTypeConstraint("integer", jsonSchema))
            return NeverDataType.create();
        if (this.isTypePermittedByTypeConstraint("integer", jsonSchema) && !this.isTypePermittedByTypeConstraint("number", jsonSchema))
            this.setNotExact();
        return PrimitiveDataType.create(PrimitiveDataTypeType.number);
    }

    private createObjectType(jsonSchema: ObjectJsonSchema) {
        if (!this.isTypePermittedByTypeConstraint("object", jsonSchema))
            return NeverDataType.create();

        const properties = new Map<string, DataType>();
        if (jsonSchema.properties !== undefined) {
            for (const [key, value] of Object.entries(jsonSchema.properties))
                properties.set(key, jsonSchemaToType(value));
        }

        const restProperties = jsonSchema.additionalProperties === undefined ? AnyDataType.create() : jsonSchemaToType(jsonSchema.additionalProperties);
        const requiredProperties = jsonSchema.required === undefined ? new Set<string>() : new Set<string>(jsonSchema.required);
        return ObjectDataType.create(properties, restProperties, requiredProperties);
    }

    private createArrayType(jsonSchema: ObjectJsonSchema) {
        if (!this.isTypePermittedByTypeConstraint("array", jsonSchema))
            return NeverDataType.create();

        const prefixElementTypes: DataType[] = jsonSchema.prefixItems !== undefined
            ? jsonSchema.prefixItems.map((v: any) => jsonSchemaToType(v))
            : [];
        const restElementType = jsonSchema.items !== undefined
            ? jsonSchemaToType(jsonSchema.items)
            : AnyDataType.create();

        const requiredElementsCount = jsonSchema.minItems === undefined ? 0 : jsonSchema.minItems as number;
        return ArrayDataType.create(prefixElementTypes, restElementType, requiredElementsCount);
    }

    private createEnumType(jsonSchema: ObjectJsonSchema) {
        if (jsonSchema.enum === undefined)
            return AnyDataType.create();
        const types = jsonSchema.enum.map((v: any) => this.createConstantType(v));
        return UnionDataType.create(types);
    }

    private createConstType(jsonSchema: ObjectJsonSchema) {
        if (jsonSchema.const === undefined)
            return AnyDataType.create();
        return this.createConstantType(jsonSchema.const);
    }

    private createAllOfType(jsonSchema: ObjectJsonSchema) {
        if (jsonSchema.allOf === undefined)
            return AnyDataType.create();
        const types = jsonSchema.allOf.map((v: any) => jsonSchemaToType(v));
        return types.reduce(intersectTypes, AnyDataType.create());
    }

    private createAnyOfType(jsonSchema: ObjectJsonSchema) {
        if (jsonSchema.anyOf === undefined)
            return AnyDataType.create();
        const types = jsonSchema.anyOf.map((v: any) => jsonSchemaToType(v));
        return UnionDataType.create(types);
    }

    private createOneOfType(jsonSchema: ObjectJsonSchema) {
        if (jsonSchema.oneOf === undefined)
            return AnyDataType.create();
        const types = jsonSchema.oneOf.map((v: any) => jsonSchemaToType(v));
        for (let i = 0; i < types.length; i++) {
            for (let j = 0; j < types.length; j++) {
                if (i !== j && !this.notExactSchemas.has(jsonSchema.oneOf[j]))
                    types[i] = subtractTypes(types[i], types[j]);
            }
        }
        return UnionDataType.create(types);
    }

    private createNotType(jsonSchema: ObjectJsonSchema) {
        if (jsonSchema.not === undefined)
            return NeverDataType.create();
        const notType = jsonSchemaToType(jsonSchema.not);
        return this.notExactSchemas.has(jsonSchema.not) ? NeverDataType.create() : notType;
    }

    private createConstantType(value: JSONPathJSONValue): DataType {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
            return LiteralDataType.create(value);
        else if (value === null)
            return PrimitiveDataType.create(PrimitiveDataTypeType.null);
        else if (Array.isArray(value))
            return this.createArrayConstantType(value);
        else
            return this.createObjectConstantType(value);
    }

    private createObjectConstantType(value: { [key: string]: JSONPathJSONValue }): DataType {
        const propertyTypes = new Map(Object.entries(value).map(([pn, pv]) => [pn, this.createConstantType(pv)]));
        const requiredProperties = new Set(Object.keys(value));
        return ObjectDataType.create(propertyTypes, NeverDataType.create(), requiredProperties);
    }

    private createArrayConstantType(value: JSONPathJSONValue[]): DataType {
        const prefixElementTypes = value.map(v => this.createConstantType(v));
        return ArrayDataType.create(prefixElementTypes, NeverDataType.create(), prefixElementTypes.length);
    }

    private createTypeAnnotation(jsonSchema: ObjectJsonSchema): DataTypeAnnotation | null {
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

    private isTypePermittedByTypeConstraint(type: string, jsonSchema: ObjectJsonSchema): boolean {
        const typeConstraint = jsonSchema.type;
        return typeConstraint === undefined || typeConstraint === type || Array.isArray(typeConstraint) && typeConstraint.includes(type);
    }

    private hasOnlyFullySupportedKeywords(jsonSchema: ObjectJsonSchema) {
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
}

type ObjectJsonSchema = {
    [key: string]: any
};

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