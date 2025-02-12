import { syntaxTree } from "@codemirror/language";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { getJSONPath } from "./jsonpath-language";
import { CompletionProvider } from "@/app/parser/completion-provider";
import { testJson } from "@/app/page";

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