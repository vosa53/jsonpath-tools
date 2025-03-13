import { AnyType, LiteralType, NeverType, ObjectType, PrimitiveType, PrimitiveTypeType, Type, TypeAnnotation, UnionType } from "./types";

export function jsonTypeDefinitionToType(jsonTypeDefinition: any): Type {
    let type = createTypeBasedOnShape(jsonTypeDefinition);

    if (jsonTypeDefinition.nullable === true)
        type = UnionType.create([type, PrimitiveType.create(PrimitiveTypeType.null)]);

    const typeAnnotation = createTypeAnnotation(jsonTypeDefinition);
    if (typeAnnotation !== null)
        type = type.addAnnotations(new Set([typeAnnotation]));

    return type;
}

function createTypeBasedOnShape(jsonTypeDefinition: any): Type {
    const typeType = createTypeType(jsonTypeDefinition);
    if (typeType !== null) return typeType;

    const enumType = createEnumType(jsonTypeDefinition);
    if (enumType !== null) return enumType;

    const elementsType = createElementsType(jsonTypeDefinition);
    if (elementsType !== null) return elementsType;

    const propertiesType = createPropertiesType(jsonTypeDefinition);
    if (propertiesType !== null) return propertiesType;

    const valuesType = createValuesType(jsonTypeDefinition);
    if (valuesType !== null) return valuesType;

    const discriminatorType = createDiscriminatorType(jsonTypeDefinition);
    if (discriminatorType !== null) return discriminatorType;

    // TODO: Is this correct? Should not we exclude null (based on "nullable" property value)?
    return AnyType.create();
}

function createTypeType(jsonTypeDefinition: any): Type | null {
    if (jsonTypeDefinition.type === undefined)
        return null;
    switch (jsonTypeDefinition.type) {
        case "boolean":
            return PrimitiveType.create(PrimitiveTypeType.boolean);
        case "string":
        case "timestamp":
            return PrimitiveType.create(PrimitiveTypeType.string);
        case "float32":
        case "float64":
        case "int8":
        case "uint8":
        case "int16":
        case "uint16":
        case "int32":
        case "uint32":
            return PrimitiveType.create(PrimitiveTypeType.number);
        default:
            return null;
    }
}

function createEnumType(jsonTypeDefinition: any): Type | null {
    if (jsonTypeDefinition.enum === undefined || !Array.isArray(jsonTypeDefinition.enum))
        return null;
    const memberLiterals: LiteralType[] = [];
    for (const enumMember of jsonTypeDefinition.enum) {
        if (typeof enumMember === "string")
            memberLiterals.push(LiteralType.create(enumMember));
    }
    return UnionType.create(memberLiterals);
}

function createElementsType(jsonTypeDefinition: any): Type | null {
    if (jsonTypeDefinition.elements === undefined)
        return null;
    return jsonTypeDefinitionToType(jsonTypeDefinition.elements);
}

function createPropertiesType(jsonTypeDefinition: any): Type | null {
    if (jsonTypeDefinition.properties === undefined && jsonTypeDefinition.optionalProperties === undefined && jsonTypeDefinition.additionalProperties === undefined)
        return null;

    const propertyTypes = new Map<string, Type>();
    let restPropertyType = NeverType.create();
    const requiredProperties = new Set<string>();
    if (jsonTypeDefinition.properties !== undefined) {
        for (const [propertyName, propertyJSONTypeDefinition] of Object.entries(jsonTypeDefinition.properties)) {
            const propertyType = jsonTypeDefinitionToType(propertyJSONTypeDefinition);
            propertyTypes.set(propertyName, propertyType);
            requiredProperties.add(propertyName);
        }
    }
    if (jsonTypeDefinition.optionalProperties !== undefined) {
        for (const [propertyName, propertyJSONTypeDefinition] of Object.entries(jsonTypeDefinition.optionalProperties)) {
            const propertyType = jsonTypeDefinitionToType(propertyJSONTypeDefinition);
            propertyTypes.set(propertyName, propertyType);
        }
    }
    if (jsonTypeDefinition.additionalProperties === true)
        restPropertyType = AnyType.create();
    
    return ObjectType.create(propertyTypes, restPropertyType, requiredProperties);
}

function createValuesType(jsonTypeDefinition: any): Type | null {
    if (jsonTypeDefinition.values === undefined)
        return null;
    const valueType = jsonTypeDefinitionToType(jsonTypeDefinition.values);
    return ObjectType.create(new Map<string, Type>(), valueType, new Set<string>());
}

function createDiscriminatorType(jsonTypeDefinition: any): Type | null {
    if (jsonTypeDefinition.mapping === undefined || jsonTypeDefinition.discriminator === undefined)
        return null;
    const types: Type[] = [];
    for (const mappingEntry of Object.entries(jsonTypeDefinition.mapping)) {
        const discriminatorValue = mappingEntry[0];
        // TODO: Add metadata.
        const type = createPropertiesType(mappingEntry[1]);
        if (!(type instanceof ObjectType)) continue;
        const propertyTypesWithDiscriminator = new Map<string, Type>(type.propertyTypes);
        propertyTypesWithDiscriminator.set(jsonTypeDefinition.discriminator, LiteralType.create(discriminatorValue));
        const requiredPropertiesWithDiscriminator = new Set<string>(type.requiredProperties);
        requiredPropertiesWithDiscriminator.add(jsonTypeDefinition.discriminator);
        const resultType = ObjectType.create(propertyTypesWithDiscriminator, type.restPropertyType, requiredPropertiesWithDiscriminator);
        types.push(resultType);
    }
    return UnionType.create(types);
}

function createTypeAnnotation(jsonTypeDefinition: any): TypeAnnotation | null {
    if (jsonTypeDefinition.metadata === undefined)
        return null;

    let description;
    if (typeof jsonTypeDefinition.metadata === "string")
        description = jsonTypeDefinition.metadata;
    else {
        const metadataJSONText = JSON.stringify(jsonTypeDefinition.metadata, null, 4);
        description = `Metadata:\n\`\`\`json\n${metadataJSONText}\n\`\`\``;
    }
    return new TypeAnnotation("", description, false, false, false, undefined, []);
}