import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { AnyDataType, ArrayDataType, intersectTypes, LiteralDataType, NeverDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, subtractTypes, DataType, DataTypeAnnotation, UnionDataType } from "./data-types";

export function jsonSchemaToType(jsonSchema: any): DataType {
    if (jsonSchema === true)
        return AnyDataType.create();
    if (jsonSchema === false)
        return NeverDataType.create();
    if (typeof jsonSchema !== "object")
        return NeverDataType.create();
    
    const types = [
        createNullType(jsonSchema),
        createBooleanType(jsonSchema),
        createStringType(jsonSchema),
        createNumberType(jsonSchema),
        createObjectType(jsonSchema),
        createArrayType(jsonSchema)
    ];

    const basicTypes = UnionDataType.create(types);
    
    const additionalConstraintTypes = [
        basicTypes,
        createEnumType(jsonSchema),
        createConstType(jsonSchema),
        createAllOfType(jsonSchema),
        createAnyOfType(jsonSchema),
        createOneOfType(jsonSchema),
    ];
    const notType = createNotType(jsonSchema);

    const additionalConstraints = additionalConstraintTypes.reduce((a, b) => intersectTypes(a, b));
    let resultType = subtractTypes(additionalConstraints, notType);

    const typeAnnotation = createTypeAnnotation(jsonSchema);
    if (typeAnnotation !== null)
        resultType = resultType.addAnnotations(new Set([typeAnnotation]));

    return resultType;
}

function createNullType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("null", jsonSchema))
        return NeverDataType.create();
    return PrimitiveDataType.create(PrimitiveDataTypeType.null);
}

function createBooleanType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("boolean", jsonSchema))
        return NeverDataType.create();
    return PrimitiveDataType.create(PrimitiveDataTypeType.boolean);
}

function createStringType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("string", jsonSchema))
        return NeverDataType.create();
    return PrimitiveDataType.create(PrimitiveDataTypeType.string);
}

function createNumberType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("number", jsonSchema) && !isTypePermittedByTypeConstraint("integer", jsonSchema))
        return NeverDataType.create();
    return PrimitiveDataType.create(PrimitiveDataTypeType.number);
}

function createObjectType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("object", jsonSchema))
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

function createArrayType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("array", jsonSchema))
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

function createEnumType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.enum === undefined)
        return AnyDataType.create();
    const types = jsonSchema.enum.map((v: any) => createConstantValueType(v));
    return UnionDataType.create(types);
}

function createConstType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.const === undefined)
        return AnyDataType.create();
    return createConstantValueType(jsonSchema.const);
}

function createAllOfType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.allOf === undefined)
        return AnyDataType.create();
    const types = jsonSchema.allOf.map((v: any) => jsonSchemaToType(v));
    return types.reduce(intersectTypes, AnyDataType.create());
}

function createAnyOfType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.anyOf === undefined)
        return AnyDataType.create();
    const types = jsonSchema.anyOf.map((v: any) => jsonSchemaToType(v));
    return UnionDataType.create(types);
}

function createOneOfType(jsonSchema: ObjectJsonSchema) {
    // TODO: better
    if (jsonSchema.oneOf === undefined)
        return AnyDataType.create();
    const types = jsonSchema.oneOf.map((v: any) => jsonSchemaToType(v));
    return UnionDataType.create(types);
}

function createNotType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.not === undefined)
        return NeverDataType.create();
    return jsonSchemaToType(jsonSchema.not);
}

function createConstantValueType(value: any): DataType {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
        return LiteralDataType.create(value);
    else
        throw new Error("Not supported."); // TODO
}

function createTypeAnnotation(jsonSchema: ObjectJsonSchema): DataTypeAnnotation | null {
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

function isTypePermittedByTypeConstraint(type: string, jsonSchema: ObjectJsonSchema): boolean {
    const typeConstraint = jsonSchema.type;
    return typeConstraint === undefined || typeConstraint === type || Array.isArray(typeConstraint) && typeConstraint.includes(type);
}

type ObjectJsonSchema = {
    [key: string]: any
};

export type RawJSONSchema = boolean | { [key: string]: JSONPathJSONValue };