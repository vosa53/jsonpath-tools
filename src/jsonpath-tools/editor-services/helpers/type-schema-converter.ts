import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { AnyType, ArrayType, intersectTypes, LiteralType, NeverType, ObjectType, PrimitiveType, PrimitiveTypeType, subtractTypes, Type, TypeAnnotation, UnionType } from "./types";
import { RawJSONSchema } from "./raw-json-schema";

type ObjectJsonSchema = {
    [key: string]: any
};

export function schemaToType(jsonSchema: any): Type {
    if (jsonSchema === true)
        return AnyType.create();
    if (jsonSchema === false)
        return NeverType.create();
    if (typeof jsonSchema !== "object")
        return NeverType.create();
    
    const types = [
        createNullType(jsonSchema),
        createBooleanType(jsonSchema),
        createStringType(jsonSchema),
        createNumberType(jsonSchema),
        createObjectType(jsonSchema),
        createArrayType(jsonSchema)
    ];

    const basicTypes = UnionType.create(types);
    
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
        return NeverType.create();
    return PrimitiveType.create(PrimitiveTypeType.null);
}

function createBooleanType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("boolean", jsonSchema))
        return NeverType.create();
    return PrimitiveType.create(PrimitiveTypeType.boolean);
}

function createStringType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("string", jsonSchema))
        return NeverType.create();
    return PrimitiveType.create(PrimitiveTypeType.string);
}

function createNumberType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("number", jsonSchema) && !isTypePermittedByTypeConstraint("integer", jsonSchema))
        return NeverType.create();
    return PrimitiveType.create(PrimitiveTypeType.number);
}

function createObjectType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("object", jsonSchema))
        return NeverType.create();

    const properties = new Map<string, Type>();
    if (jsonSchema.properties !== undefined) {
        for (const [key, value] of Object.entries(jsonSchema.properties))
            properties.set(key, schemaToType(value));
    }

    const restProperties = jsonSchema.additionalProperties === undefined ? AnyType.create() : schemaToType(jsonSchema.additionalProperties);
    const requiredProperties = jsonSchema.required === undefined ? new Set<string>() : new Set<string>(jsonSchema.required);
    return ObjectType.create(properties, restProperties, requiredProperties);
}

function createArrayType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("array", jsonSchema))
        return NeverType.create();

    const prefixElementTypes: Type[] = jsonSchema.prefixItems !== undefined
        ? jsonSchema.prefixItems.map((v: any) => schemaToType(v))
        : [];
    const restElementType = jsonSchema.items !== undefined 
        ? schemaToType(jsonSchema.items) 
        : AnyType.create();

    const requiredElementsCount = jsonSchema.minItems === undefined ? 0 : jsonSchema.minItems as number;
    return ArrayType.create(prefixElementTypes, restElementType, requiredElementsCount);
}

function createEnumType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.enum === undefined)
        return AnyType.create();
    const types = jsonSchema.enum.map((v: any) => createConstantValueType(v));
    return UnionType.create(types);
}

function createConstType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.const === undefined)
        return AnyType.create();
    return createConstantValueType(jsonSchema.const);
}

function createAllOfType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.allOf === undefined)
        return AnyType.create();
    const types = jsonSchema.allOf.map((v: any) => schemaToType(v));
    return types.reduce(intersectTypes, AnyType.create());
}

function createAnyOfType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.anyOf === undefined)
        return AnyType.create();
    const types = jsonSchema.anyOf.map((v: any) => schemaToType(v));
    return UnionType.create(types);
}

function createOneOfType(jsonSchema: ObjectJsonSchema) {
    // TODO: better
    if (jsonSchema.oneOf === undefined)
        return AnyType.create();
    const types = jsonSchema.oneOf.map((v: any) => schemaToType(v));
    return UnionType.create(types);
}

function createNotType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.not === undefined)
        return NeverType.create();
    return schemaToType(jsonSchema.not);
}

function createConstantValueType(value: any): Type {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
        return LiteralType.create(value);
    else
        throw new Error("Not supported."); // TODO
}

function createTypeAnnotation(jsonSchema: ObjectJsonSchema): TypeAnnotation | null {
    const title = jsonSchema.title;
    const description = jsonSchema.description;
    const readOnly = jsonSchema.readOnly;
    const writeOnly = jsonSchema.writeOnly;
    const deprecated = jsonSchema.deprecated;
    const defaultValue = jsonSchema.default;
    const exampleValues = jsonSchema.examples;
    if (title === undefined && description === undefined && readOnly === undefined && writeOnly === undefined && deprecated === undefined && defaultValue === undefined && exampleValues === undefined)
        return null;
    return new TypeAnnotation(
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
