export interface DataTypeRaw {
    readonly format: DataTypeRawFormat,
    readonly jsonSchemaText: string,
    readonly jsonTypeDefinitionText: string
}

export enum DataTypeRawFormat {
    jsonSchema = "jsonSchema",
    jsonTypeDefinition = "jsonTypeDefinition"
}