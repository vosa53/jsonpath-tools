export interface Example {
    readonly name: string;
    readonly jsonText: string;
    readonly jsonSchemaText: string;
    readonly jsonTypeDefinitionText: string;
}

export const examples: readonly Example[] = [
    {
        name: "Some Example 1",
        jsonText: `"TODO: JSON"`,
        jsonSchemaText: `"TODO: JSON Schema"`,
        jsonTypeDefinitionText: `"TODO: JSON Type Definition"`
    },
    {
        name: "Some Example 2",
        jsonText: `"TODO: JSON"`,
        jsonSchemaText: `"TODO: JSON Schema"`,
        jsonTypeDefinitionText: `"TODO: JSON Type Definition"`
    },
    {
        name: "Some Example 3",
        jsonText: `"TODO: JSON"`,
        jsonSchemaText: `"TODO: JSON Schema"`,
        jsonTypeDefinitionText: `"TODO: JSON Type Definition"`
    }
];