import { CompletionItemType } from "@/jsonpath-tools/editor-services/completion-provider";
import { Completion, CompletionContext, CompletionSource, snippetCompletion } from "@codemirror/autocomplete";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField } from "./jsonpath-state";
import { MarkdownRenderer } from "./markdown-renderer";


export function jsonPathCompletionSource(): CompletionSource {
    return async (context: CompletionContext) => {
        const word = context.matchBefore(/\w*/)!;
        if (context.explicit || word.from !== word.to || context.matchBefore(/\.|,\s?|\[/)) {
            const languageServiceSession = context.state.field(languageServiceSessionStateField);
            try {
                const completions = await languageServiceSession.getCompletions(context.pos);

                return {
                    from: word.from,
                    options: completions.map((c, i) => {
                        let completion: Completion = {
                            label: c.text,
                            type: convertCompletionItemTypeToCodemirrorType(c.type),
                            detail: c.detail,
                            info: async () => {
                                const description = await languageServiceSession.resolveCompletion(i);
                                const element = document.createElement("div");
                                element.innerHTML = MarkdownRenderer.renderToHTML(description);
                                return element;
                            }
                        };
                        if (c.isSnippet)
                            completion = snippetCompletion(c.text, completion);
                        return completion;
                    })
                };
            }
            catch (error) {
                if (error instanceof OperationCancelledError) return null;
                else throw error;
            }
        }
        else
            return null;
    };
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