import { AnyDataType, ArrayDataType, DataType, DataTypeAnnotation, LiteralDataType, NeverDataType, ObjectDataType, PrimitiveDataType, UnionDataType } from "@jsonpath-tools/jsonpath";

/**
 * Serializes a data type for a use with the structured clone algorithm.
 * @param type Data type.
 */
export function serializeDataType(type: DataType) {
    const fromCache = serializedTypeCache.get(type);
    if (fromCache !== undefined) return fromCache;
    let serializedType: any;
    if (type instanceof AnyDataType)
        serializedType = { kind: "any" };
    else if (type instanceof NeverDataType)
        serializedType = { kind: "never" };
    else if (type instanceof LiteralDataType)
        serializedType = { kind: "literal", value: type.value };
    else if (type instanceof PrimitiveDataType)
        serializedType = { kind: "primitive", type: type.type };
    else if (type instanceof ObjectDataType)
        serializedType = { kind: "object", propertyTypes: type.propertyTypes.entries().map(([name, value]) => [name, serializeDataType(value)]).toArray(), restPropertyType: serializeDataType(type.restPropertyType), requiredProperties: Array.from(type.requiredProperties) };
    else if (type instanceof ArrayDataType)
        serializedType = { kind: "array", prefixElementTypes: type.prefixElementTypes.map(serializeDataType), restElementType: serializeDataType(type.restElementType), requiredElementCount: type.requiredElementCount };
    else if (type instanceof UnionDataType)
        serializedType = { kind: "union", types: type.types.map(serializeDataType) };
    else
        throw new Error("Unsupported data type.");

    serializedType.annotations = type.annotations.values().map(serializeAnnotation).toArray();
    serializedTypeCache.set(type, serializedType);
    return serializedType;
}

/**
 * Deserializes a data type serialized with {@link serializeDataType}.
 * @param serializedType Serialized data type.
 */
export function deserializeDataType(serializedType: any): DataType {
    const fromCache = deserializedTypeCache.get(serializedType);
    if (fromCache !== undefined) return fromCache;
    let type: DataType;
    if (serializedType.kind === "any")
        type = AnyDataType.create();
    else if (serializedType.kind === "never")
        type = NeverDataType.create();
    else if (serializedType.kind === "literal")
        type = LiteralDataType.create(serializedType.value);
    else if (serializedType.kind === "primitive")
        type = PrimitiveDataType.create(serializedType.type);
    else if (serializedType.kind === "object") {
        const propertyTypes = new Map<string, DataType>(serializedType.propertyTypes.map(([name, type]: [string, any]) => [name, deserializeDataType(type)]));
        const restPropertyType = deserializeDataType(serializedType.restPropertyType);
        const requiredProperties = new Set<string>(serializedType.requiredProperties);
        type = ObjectDataType.create(propertyTypes, restPropertyType, requiredProperties);
    }
    else if (serializedType.kind === "array") {
        const prefixElementTypes = serializedType.prefixElementTypes.map(deserializeDataType);
        const restElementType = deserializeDataType(serializedType.restElementType);
        const requiredElementCount = serializedType.requiredElementCount;
        type = ArrayDataType.create(prefixElementTypes, restElementType, requiredElementCount);
    }
    else if (serializedType.kind === "union") {
        const types = serializedType.types.map(deserializeDataType);
        type = UnionDataType.create(types);
    }
    else
        throw new Error("Unsupported data type.");

    if (serializedType.annotations.length !== 0)
        type = type.withAnnotations(new Set(serializedType.annotations.map(deserializeAnnotation)));
    deserializedTypeCache.set(serializedType, type);
    return type;
}

function serializeAnnotation(annotation: DataTypeAnnotation) {
    const fromCache = serializedAnnotationCache.get(annotation);
    if (fromCache !== undefined) return fromCache;
    const serializedAnnotation = {
        title: annotation.title,
        description: annotation.description,
        deprecated: annotation.deprecated,
        readOnly: annotation.readOnly,
        writeOnly: annotation.writeOnly,
        defaultValue: annotation.defaultValue,
        exampleValues: annotation.exampleValues
    };
    serializedAnnotationCache.set(annotation, serializedAnnotation);
    return serializedAnnotation;
}

function deserializeAnnotation(serializedAnnotation: any): DataTypeAnnotation {
    const fromCache = deserializedAnnotationCache.get(serializedAnnotation);
    if (fromCache !== undefined) return fromCache;
    const annotation = new DataTypeAnnotation(
        serializedAnnotation.title,
        serializedAnnotation.description,
        serializedAnnotation.deprecated,
        serializedAnnotation.readOnly,
        serializedAnnotation.writeOnly,
        serializedAnnotation.defaultValue,
        serializedAnnotation.exampleValues
    );
    deserializedAnnotationCache.set(serializedAnnotation, annotation);
    return annotation;
}

const serializedTypeCache = new WeakMap<DataType, any>();
const deserializedTypeCache = new WeakMap<any, DataType>();
const serializedAnnotationCache = new WeakMap<DataTypeAnnotation, any>();
const deserializedAnnotationCache = new WeakMap<any, DataTypeAnnotation>();