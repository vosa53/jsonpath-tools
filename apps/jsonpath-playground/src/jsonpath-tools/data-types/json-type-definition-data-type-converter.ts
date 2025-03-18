import { AnyDataType, LiteralDataType, NeverDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, DataType, DataTypeAnnotation, UnionDataType } from "./data-types";

export function jsonTypeDefinitionToType(jsonTypeDefinition: any): DataType {
    let type = createTypeBasedOnShape(jsonTypeDefinition);

    if (jsonTypeDefinition.nullable === true)
        type = UnionDataType.create([type, PrimitiveDataType.create(PrimitiveDataTypeType.null)]);

    const typeAnnotation = createTypeAnnotation(jsonTypeDefinition);
    if (typeAnnotation !== null)
        type = type.addAnnotations(new Set([typeAnnotation]));

    return type;
}

function createTypeBasedOnShape(jsonTypeDefinition: any): DataType {
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
    return AnyDataType.create();
}

function createTypeType(jsonTypeDefinition: any): DataType | null {
    if (jsonTypeDefinition.type === undefined)
        return null;
    switch (jsonTypeDefinition.type) {
        case "boolean":
            return PrimitiveDataType.create(PrimitiveDataTypeType.boolean);
        case "string":
        case "timestamp":
            return PrimitiveDataType.create(PrimitiveDataTypeType.string);
        case "float32":
        case "float64":
        case "int8":
        case "uint8":
        case "int16":
        case "uint16":
        case "int32":
        case "uint32":
            return PrimitiveDataType.create(PrimitiveDataTypeType.number);
        default:
            return null;
    }
}

function createEnumType(jsonTypeDefinition: any): DataType | null {
    if (jsonTypeDefinition.enum === undefined || !Array.isArray(jsonTypeDefinition.enum))
        return null;
    const memberLiterals: LiteralDataType[] = [];
    for (const enumMember of jsonTypeDefinition.enum) {
        if (typeof enumMember === "string")
            memberLiterals.push(LiteralDataType.create(enumMember));
    }
    return UnionDataType.create(memberLiterals);
}

function createElementsType(jsonTypeDefinition: any): DataType | null {
    if (jsonTypeDefinition.elements === undefined)
        return null;
    return jsonTypeDefinitionToType(jsonTypeDefinition.elements);
}

function createPropertiesType(jsonTypeDefinition: any): DataType | null {
    if (jsonTypeDefinition.properties === undefined && jsonTypeDefinition.optionalProperties === undefined && jsonTypeDefinition.additionalProperties === undefined)
        return null;

    const propertyTypes = new Map<string, DataType>();
    let restPropertyType = NeverDataType.create();
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
        restPropertyType = AnyDataType.create();
    
    return ObjectDataType.create(propertyTypes, restPropertyType, requiredProperties);
}

function createValuesType(jsonTypeDefinition: any): DataType | null {
    if (jsonTypeDefinition.values === undefined)
        return null;
    const valueType = jsonTypeDefinitionToType(jsonTypeDefinition.values);
    return ObjectDataType.create(new Map<string, DataType>(), valueType, new Set<string>());
}

function createDiscriminatorType(jsonTypeDefinition: any): DataType | null {
    if (jsonTypeDefinition.mapping === undefined || jsonTypeDefinition.discriminator === undefined)
        return null;
    const types: DataType[] = [];
    for (const mappingEntry of Object.entries(jsonTypeDefinition.mapping)) {
        const discriminatorValue = mappingEntry[0];
        // TODO: Add metadata.
        const type = createPropertiesType(mappingEntry[1]);
        if (!(type instanceof ObjectDataType)) continue;
        const propertyTypesWithDiscriminator = new Map<string, DataType>(type.propertyTypes);
        propertyTypesWithDiscriminator.set(jsonTypeDefinition.discriminator, LiteralDataType.create(discriminatorValue));
        const requiredPropertiesWithDiscriminator = new Set<string>(type.requiredProperties);
        requiredPropertiesWithDiscriminator.add(jsonTypeDefinition.discriminator);
        const resultType = ObjectDataType.create(propertyTypesWithDiscriminator, type.restPropertyType, requiredPropertiesWithDiscriminator);
        types.push(resultType);
    }
    return UnionDataType.create(types);
}

function createTypeAnnotation(jsonTypeDefinition: any): DataTypeAnnotation | null {
    if (jsonTypeDefinition.metadata === undefined)
        return null;

    let description;
    if (typeof jsonTypeDefinition.metadata === "string")
        description = jsonTypeDefinition.metadata;
    else {
        const metadataJSONText = JSON.stringify(jsonTypeDefinition.metadata, null, 4);
        description = `Metadata:\n\`\`\`json\n${metadataJSONText}\n\`\`\``;
    }
    return new DataTypeAnnotation("", description, false, false, false, undefined, []);
}