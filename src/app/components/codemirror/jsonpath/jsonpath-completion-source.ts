import { testJson } from "@/app/page";
import { CompletionItemType, CompletionProvider } from "@/jsonpath-tools/editor-services/completion-provider";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { getJSONPath, workerStateField } from "./jsonpath-language";
import { defaultJSONPathOptions } from "@/jsonpath-tools/options";

export async function jsonPathCompletionSource(context: CompletionContext): Promise<CompletionResult | null> {
    const word = context.matchBefore(/\w*/)!;
    if (context.explicit || word.from !== word.to || context.matchBefore(/\.|,\s?|\[/)) {
        const worker = context.state.field(workerStateField);
        const completions = await worker.getCompletions(context.pos);

        /*const completionProvider = new CompletionProvider(defaultJSONPathOptions);
        const jsonPath = getJSONPath(syntaxTree(context.state));
        const completions = completionProvider.provideCompletions(jsonPath, JSON.parse(testJson), context.pos);*/

        return {
            from: word.from,
            options: completions.map(c => ({
                label: c.text,
                type: convertCompletionItemTypeToCodemirrorType(c.type),
                detail: "aa",
                info: "Further description."
            })),
        };
    }
    else
        return null;
}

const completionItemTypeToCodemirrorType: ReadonlyMap<CompletionItemType, string> = new Map<CompletionItemType, string>([
    [CompletionItemType.name, "property"],
    [CompletionItemType.syntax, "keyword"],
    [CompletionItemType.function, "function"],
    [CompletionItemType.literal, "constant"]
]);

function convertCompletionItemTypeToCodemirrorType(type: CompletionItemType): string {
    const codemirrorType = completionItemTypeToCodemirrorType.get(type);
    if (codemirrorType === undefined) throw new Error("Unknown type.");
    return codemirrorType;
}