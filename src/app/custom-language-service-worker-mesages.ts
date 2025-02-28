export type CustomLanguageServiceWorkerMessage =
    { readonly type: "languageServiceData", readonly data: any } |
    { readonly type: "updateCustomFunctions", readonly customFunctions: readonly CustomLanguageServiceFunction[] };

export interface CustomLanguageServiceFunction {
    readonly name: string;
    readonly parameterNames: readonly string[];
    readonly code: string;
}