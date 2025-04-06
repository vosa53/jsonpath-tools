import { DataType, UnionDataType, ObjectDataType, ArrayDataType, NeverDataType, AnyDataType, LiteralDataType, PrimitiveDataType } from "./data-types";

/**
 * Creates a new data type that will contain values from intersection of values of types {@link typeA} and {@link typeB}.
 * @param typeA Type A.
 * @param typeB Type B.
 */
export function intersectTypes(typeA: DataType, typeB: DataType): DataType {
    if (typeA instanceof UnionDataType)
        return UnionDataType.create(typeA.types.map(type => intersectTypes(type, typeB)), typeA.annotations);
    if (typeB instanceof UnionDataType)
        return UnionDataType.create(typeB.types.map(type => intersectTypes(typeA, type)), typeB.annotations);

    if (isSubtypeOf(typeA, typeB))
        return typeA.addAnnotations(typeB.annotations);
    if (isSubtypeOf(typeB, typeA))
        return typeB.addAnnotations(typeA.annotations);

    if (typeA instanceof ObjectDataType && typeB instanceof ObjectDataType) {
        const propertyNames = new Set([...typeA.propertyTypes.keys(), ...typeB.propertyTypes.keys()]);
        const intersectedPropertyTypes = new Map<string, DataType>();
        for (const propertyName of propertyNames) {
            const propertyTypeA = typeA.getTypeAtPathSegment(propertyName);
            const propertyTypeB = typeB.getTypeAtPathSegment(propertyName);
            const intersectedPropertyType = intersectTypes(propertyTypeA, propertyTypeB);
            intersectedPropertyTypes.set(propertyName, intersectedPropertyType);
        }
        const intersectedRestPropertyType = intersectTypes(typeA.restPropertyType, typeB.restPropertyType);
        const intersectedRequiredProperties = typeA.requiredProperties.union(typeB.requiredProperties);
        const intersectedAnnotations = typeA.annotations.union(typeB.annotations);
        return ObjectDataType.create(intersectedPropertyTypes, intersectedRestPropertyType, intersectedRequiredProperties, intersectedAnnotations);
    }
    if (typeA instanceof ArrayDataType && typeB instanceof ArrayDataType) {
        const prefixElementTypes: DataType[] = [];
        for (let i = 0; i < Math.max(typeA.prefixElementTypes.length, typeB.prefixElementTypes.length); i++) {
            const intersectedPrefixElementType = intersectTypes(typeA.prefixElementTypes[i], typeB.prefixElementTypes[i]);
            prefixElementTypes.push(intersectedPrefixElementType);
        }
        const restElementType = intersectTypes(typeA.restElementType, typeB.restElementType);
        const intersectedRequiredElementCount = Math.max(typeA.requiredElementCount, typeB.requiredElementCount);
        const intersectedAnnotations = typeA.annotations.union(typeB.annotations);
        return ArrayDataType.create(prefixElementTypes, restElementType, intersectedRequiredElementCount, intersectedAnnotations);
    }
    return NeverDataType.create();
}

/**
 * Approximately creates a new data type that will contain values that are in the type {@link typeA} and are not in the type {@link typeB}.
 * 
 * *This function is only an approximation and the result type can be a superset of a correct type.*
 * @param typeA Type A.
 * @param typeB Type B.
 */
export function subtractTypes(typeA: DataType, typeB: DataType): DataType {
    if (typeA instanceof UnionDataType) {
        const newTypes = typeA.types.map(type => subtractTypes(type, typeB));
        return UnionDataType.create(newTypes, typeA.annotations);
    }
    if (typeB instanceof UnionDataType) {
        const newTypes = typeB.types.map(type => subtractTypes(typeA, type));
        return UnionDataType.create(newTypes, typeB.annotations);
    }
    if (isSubtypeOf(typeA, typeB))
        return NeverDataType.create();

    return typeA;
}

/**
 * Approximately checks if the type {@link typeA} is a subtype of the type {@link typeB} (all values from {@link typeA} are also in {@link typeB}).
 * 
 * *This function is only an approximation, when it returns `true` the result is correct, but when it returns `false` the result is unknown.*
 * @param typeA Type A.
 * @param typeB Type B.
 */
export function isSubtypeOf(typeA: DataType, typeB: DataType): boolean {
    if (typeA === typeB)
        return true;
    if (typeB instanceof AnyDataType)
        return true;
    if (typeB instanceof UnionDataType)
        return typeB.types.some(type => isSubtypeOf(typeA, type));

    if (typeA instanceof LiteralDataType)
        return typeB instanceof LiteralDataType && typeA.value === typeB.value || typeB instanceof PrimitiveDataType && typeA.type === typeB.type;
    if (typeA instanceof PrimitiveDataType)
        return typeB instanceof PrimitiveDataType && typeA.type === typeB.type;
    if (typeA instanceof ObjectDataType) {
        if (typeB instanceof ObjectDataType) {
            const propertyNames = new Set([...typeA.propertyTypes.keys(), ...typeB.propertyTypes.keys()]);
            for (const propertyName of propertyNames) {
                if (!isSubtypeOf(typeA.getTypeAtPathSegment(propertyName), typeB.getTypeAtPathSegment(propertyName)))
                    return false;
            }
            if (!isSubtypeOf(typeA.restPropertyType, typeB.restPropertyType))
                return false;
            if (!typeA.requiredProperties.isSupersetOf(typeB.requiredProperties))
                return false;
            return true;
        }

        else
            return false;
    }
    if (typeA instanceof ArrayDataType) {
        if (typeB instanceof ArrayDataType) {
            for (let i = 0; i < Math.max(typeA.prefixElementTypes.length, typeB.prefixElementTypes.length); i++) {
                if (!isSubtypeOf(typeA.getTypeAtPathSegment(i), typeB.getTypeAtPathSegment(i)))
                    return false;
            }
            if (!isSubtypeOf(typeA.restElementType, typeB.restElementType))
                return false;
            if (!(typeA.requiredElementCount >= typeB.requiredElementCount))
                return false;
            return true;
        }
    }
    if (typeA instanceof NeverDataType)
        return true;
    if (typeA instanceof UnionDataType)
        return typeA.types.every(type => isSubtypeOf(type, typeB));
    return false;
}

/**
 * Approximately checks if the type {@link typeA} is a same type as the type {@link typeB} (all values from {@link typeA} are also in {@link typeB} and vice-versa).
 * 
 * *This function is only an approximation, when it returns `true` the result is correct, but when it returns `false` the result is unknown.*
 * @param typeA Type A.
 * @param typeB Type B.
 */
export function isEquvivalentTypeWith(typeA: DataType, typeB: DataType): boolean {
    return isSubtypeOf(typeA, typeB) && isSubtypeOf(typeB, typeA);
}
