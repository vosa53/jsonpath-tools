import { testJson } from "@/app/page";
import { CompletionProvider } from "@/jsonpath-tools/editor-services/completion-provider";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { getJSONPath } from "./jsonpath-language";

export function jsonPathCompletionSource(context: CompletionContext): CompletionResult | null {
    const jsonPath = getJSONPath(syntaxTree(context.state));
    const completions = CompletionProvider.provideCompletions(jsonPath, context.pos, JSON.parse(testJson));

    const word = context.matchBefore(/\w*/)!;
    if (word.from === word.to && !context.explicit)
        return null;

    return {
        from: word.from,
        options: completions.map(c => ({
            label: c.text,
            type: "variable"
        }))
    };
}