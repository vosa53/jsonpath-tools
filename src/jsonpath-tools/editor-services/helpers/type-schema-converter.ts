import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { AnyType, intersectTypes, LiteralType, NeverType, ObjectType, PrimitiveType, PrimitiveTypeType, subtractTypes, Type, UnionType } from "./types";

type ObjectJsonSchema = {
    [key: string]: any
};

export function schemaToType(jsonSchema: any): Type {
    if (jsonSchema === true)
        return AnyType.instance;
    if (jsonSchema === false)
        return NeverType.instance;
    if (typeof jsonSchema !== "object")
        return NeverType.instance;
    
    const types = [
        createStringType(jsonSchema),
        createNumberType(jsonSchema),
        createObjectType(jsonSchema)
    ];

    const basicTypes = new UnionType(types).simplify();
    
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
    return subtractTypes(additionalConstraints, notType);
}

function createStringType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("string", jsonSchema))
        return NeverType.instance;
    return new PrimitiveType(PrimitiveTypeType.string);
}

function createNumberType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("number", jsonSchema) && !isTypePermittedByTypeConstraint("integer", jsonSchema))
        return NeverType.instance;
    return new PrimitiveType(PrimitiveTypeType.number);
}

function createObjectType(jsonSchema: ObjectJsonSchema) {
    if (!isTypePermittedByTypeConstraint("object", jsonSchema))
        return NeverType.instance;

    const properties = new Map<string, Type>();
    if (jsonSchema.properties !== undefined) {
        for (const [key, value] of Object.entries(jsonSchema.properties))
            properties.set(key, schemaToType(value));
    }

    const restProperties = jsonSchema.additionalProperties === undefined ? AnyType.instance : schemaToType(jsonSchema.additionalProperties);
    const requiredProperties = jsonSchema.required === undefined ? new Set<string>() : new Set<string>(jsonSchema.required);
    return new ObjectType(properties, restProperties, requiredProperties);
}

function createEnumType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.enum === undefined)
        return AnyType.instance;
    const types = jsonSchema.enum.map((v: any) => createConstantValueType(v));
    return new UnionType(types).simplify();
}

function createConstType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.const === undefined)
        return AnyType.instance;
    return createConstantValueType(jsonSchema.const);
}

function createAllOfType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.allOf === undefined)
        return AnyType.instance;
    const types = jsonSchema.allOf.map((v: any) => schemaToType(v));
    return types.reduce(intersectTypes, AnyType.instance);
}

function createAnyOfType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.anyOf === undefined)
        return AnyType.instance;
    const types = jsonSchema.anyOf.map((v: any) => schemaToType(v));
    return new UnionType(types).simplify();
}

function createOneOfType(jsonSchema: ObjectJsonSchema) {
    // TODO: better
    if (jsonSchema.oneOf === undefined)
        return AnyType.instance;
    const types = jsonSchema.oneOf.map((v: any) => schemaToType(v));
    return new UnionType(types).simplify();
}

function createNotType(jsonSchema: ObjectJsonSchema) {
    if (jsonSchema.not === undefined)
        return NeverType.instance;
    return schemaToType(jsonSchema.not);
}

function createConstantValueType(value: any): Type {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
        return new LiteralType(value);
    else
        throw new Error("Not supported."); // TODO
}

function isTypePermittedByTypeConstraint(type: string, jsonSchema: ObjectJsonSchema): boolean {
    const typeConstraint = jsonSchema.type;
    return typeConstraint === undefined || typeConstraint === type || Array.isArray(typeConstraint) && typeConstraint.includes(type);
}
