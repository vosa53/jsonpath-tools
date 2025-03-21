import { JSONPathJSONValue } from "../types";
import { AnyDataType, LiteralDataType, NeverDataType, ObjectDataType, PrimitiveDataType, PrimitiveDataTypeType, DataType, DataTypeAnnotation, UnionDataType, ArrayDataType } from "./data-types";

export function jsonTypeDefinitionToType(jsonTypeDefinition: JSONTypeDefinition): DataType {
    const context = new JSONTypeDefinitionDataTypeConverterContext(
        jsonTypeDefinition.definitions ?? {}
    );
    return context.jsonTypeDefinitionToType(jsonTypeDefinition);
}

class JSONTypeDefinitionDataTypeConverterContext {
    private readonly visitedSchemas = new Map<JSONTypeDefinition, DataType>();

    constructor(
        readonly definitions: JSONTypeDefinitionDictionary
    ) { }

    jsonTypeDefinitionToType(jsonTypeDefinition: JSONTypeDefinition): DataType {
        const fromCache = this.visitedSchemas.get(jsonTypeDefinition);
        if (fromCache !== undefined) 
            return fromCache;

        const typeAnnotation = this.createTypeAnnotation(jsonTypeDefinition);
        const typeAnnotations = typeAnnotation !== null ? new Set([typeAnnotation]) : DataTypeAnnotation.EMPTY_SET;
        this.visitedSchemas.set(jsonTypeDefinition, AnyDataType.create(typeAnnotations));

        let type = this.createTypeBasedOnShape(jsonTypeDefinition);
        if (jsonTypeDefinition.nullable === true)
            type = UnionDataType.create([type, PrimitiveDataType.create(PrimitiveDataTypeType.null)]);
        type = type.addAnnotations(typeAnnotations);

        this.visitedSchemas.set(jsonTypeDefinition, type);
        return type;
    }

    private createTypeBasedOnShape(jsonTypeDefinition: JSONTypeDefinition): DataType {
        const typeType = this.createTypeType(jsonTypeDefinition);
        if (typeType !== null) return typeType;

        const enumType = this.createEnumType(jsonTypeDefinition);
        if (enumType !== null) return enumType;

        const elementsType = this.createElementsType(jsonTypeDefinition);
        if (elementsType !== null) return elementsType;

        const propertiesType = this.createPropertiesType(jsonTypeDefinition);
        if (propertiesType !== null) return propertiesType;

        const valuesType = this.createValuesType(jsonTypeDefinition);
        if (valuesType !== null) return valuesType;

        const discriminatorType = this.createDiscriminatorType(jsonTypeDefinition);
        if (discriminatorType !== null) return discriminatorType;

        const refType = this.createRefType(jsonTypeDefinition);
        if (refType !== null) return refType;

        return AnyDataType.create();
    }

    private createTypeType(jsonTypeDefinition: JSONTypeDefinition): DataType | null {
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

    private createEnumType(jsonTypeDefinition: JSONTypeDefinition): DataType | null {
        if (jsonTypeDefinition.enum === undefined || !Array.isArray(jsonTypeDefinition.enum))
            return null;
        const memberLiterals: LiteralDataType[] = [];
        for (const enumMember of jsonTypeDefinition.enum) {
            if (typeof enumMember === "string")
                memberLiterals.push(LiteralDataType.create(enumMember));
        }
        return UnionDataType.create(memberLiterals);
    }

    private createElementsType(jsonTypeDefinition: JSONTypeDefinition): DataType | null {
        if (jsonTypeDefinition.elements === undefined)
            return null;
        const elementType = this.jsonTypeDefinitionToType(jsonTypeDefinition.elements);
        return ArrayDataType.create([], elementType, 0);
    }

    private createPropertiesType(jsonTypeDefinition: JSONTypeDefinition): DataType | null {
        if (jsonTypeDefinition.properties === undefined && jsonTypeDefinition.optionalProperties === undefined && jsonTypeDefinition.additionalProperties === undefined)
            return null;

        const propertyTypes = new Map<string, DataType>();
        let restPropertyType = NeverDataType.create();
        const requiredProperties = new Set<string>();
        if (jsonTypeDefinition.properties !== undefined) {
            for (const [propertyName, propertyJSONTypeDefinition] of Object.entries(jsonTypeDefinition.properties)) {
                const propertyType = this.jsonTypeDefinitionToType(propertyJSONTypeDefinition);
                propertyTypes.set(propertyName, propertyType);
                requiredProperties.add(propertyName);
            }
        }
        if (jsonTypeDefinition.optionalProperties !== undefined) {
            for (const [propertyName, propertyJSONTypeDefinition] of Object.entries(jsonTypeDefinition.optionalProperties)) {
                const propertyType = this.jsonTypeDefinitionToType(propertyJSONTypeDefinition);
                propertyTypes.set(propertyName, propertyType);
            }
        }
        if (jsonTypeDefinition.additionalProperties === true)
            restPropertyType = AnyDataType.create();

        return ObjectDataType.create(propertyTypes, restPropertyType, requiredProperties);
    }

    private createValuesType(jsonTypeDefinition: any): DataType | null {
        if (jsonTypeDefinition.values === undefined)
            return null;
        const valueType = this.jsonTypeDefinitionToType(jsonTypeDefinition.values);
        return ObjectDataType.create(new Map<string, DataType>(), valueType, new Set<string>());
    }

    private createDiscriminatorType(jsonTypeDefinition: JSONTypeDefinition): DataType | null {
        if (jsonTypeDefinition.mapping === undefined || jsonTypeDefinition.discriminator === undefined)
            return null;
        const types: DataType[] = [];
        for (const mappingEntry of Object.entries(jsonTypeDefinition.mapping)) {
            const discriminatorValue = mappingEntry[0];
            const type = this.jsonTypeDefinitionToType(mappingEntry[1]);
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

    private createRefType(jsonTypeDefinition: JSONTypeDefinition): DataType | null {
        if (jsonTypeDefinition.ref === undefined)
            return null;
        if (!(jsonTypeDefinition.ref in this.definitions))
            return null;
        
        const referencedJSONTypeDefinition = this.definitions[jsonTypeDefinition.ref];
        return this.jsonTypeDefinitionToType(referencedJSONTypeDefinition);
    }

    private createTypeAnnotation(jsonTypeDefinition: JSONTypeDefinition): DataTypeAnnotation | null {
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
}

export interface JSONTypeDefinition {
    readonly type?: JSONTypeDefinitionType;
    readonly enum?: readonly string[];
    readonly elements?: JSONTypeDefinition;
    readonly properties?: JSONTypeDefinitionDictionary;
    readonly optionalProperties?: JSONTypeDefinitionDictionary;
    readonly additionalProperties?: boolean;
    readonly discriminator?: string;
    readonly mapping?: JSONTypeDefinitionDictionary;
    readonly ref?: string;
    readonly nullable?: boolean;
    readonly metadata?: JSONPathJSONValue;
    readonly definitions?: JSONTypeDefinitionDictionary
}

export type JSONTypeDefinitionType = "boolean" | "string" | "timestamp" | "float32" | "float64" | "int8" | "uint8" | "int16" | "uint16" | "int32" | "uint32";
export type JSONTypeDefinitionDictionary = { readonly [key: string]: JSONTypeDefinition };