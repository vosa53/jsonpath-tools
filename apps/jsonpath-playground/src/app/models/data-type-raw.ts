/**
 * Data type in some common format like JSON Schema.
 */
export interface DataTypeRaw {
    /**
     * Format.
     */
    readonly format: DataTypeRawFormat,

    /**
     * JSON Schema text when {@link format} is {@link DataTypeRawFormat.jsonSchema}.
     */
    readonly jsonSchemaText: string,

    /**
     * JSON Type Definition text when {@link format} is {@link DataTypeRawFormat.jsonTypeDefinition}.
     */
    readonly jsonTypeDefinitionText: string
}

/**
 * Format used to provide a data type.
 */
export enum DataTypeRawFormat {
    /**
     * JSON Schema.
     */
    jsonSchema = "jsonSchema",

    /**
     * JSON Type Definition ([RFC 8297](https://datatracker.ietf.org/doc/html/rfc8927)).
     */
    jsonTypeDefinition = "jsonTypeDefinition"
}