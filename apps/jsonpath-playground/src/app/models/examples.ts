export interface Example {
    readonly name: string;
    readonly jsonText: string;
    readonly jsonSchemaText: string;
    readonly jsonTypeDefinitionText: string;
}

export const examples: readonly Example[] = [
    {
        name: "Some example",
        jsonText: `"json"`,
        jsonSchemaText: `"json schema"`,
        jsonTypeDefinitionText: `"json type definition"`
    }
];