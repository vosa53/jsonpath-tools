import { CompletionItemTextType, CompletionItemType } from "@/jsonpath-tools/editor-services/completion-service";
import { Completion, CompletionContext, CompletionSource, insertCompletionText, pickedCompletion, snippet } from "@codemirror/autocomplete";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField } from "./jsonpath-state";
import { MarkdownRenderer } from "./markdown-renderer";


export function jsonPathCompletionSource(): CompletionSource {
    return async (context: CompletionContext) => {
        // TODO: Add all word and number characters.
        if (context.explicit || context.matchBefore(/\w|\.|\[|\(|,\s|"|'|\?/)) {
            const word = context.matchBefore(/[\w"]*/);
            const languageServiceSession = context.state.field(languageServiceSessionStateField);
            try {
                const completions = await languageServiceSession.getCompletions(context.pos);

                return {
                    from: word!.from,
                    options: completions.map((c, i) => {
                        let completion: Completion = {
                            label: c.label,
                            type: convertCompletionItemTypeToCodemirrorType(c.type),
                            detail: c.detail,
                            info: async () => {
                                try {
                                    const description = await languageServiceSession.resolveCompletion(i);
                                    const element = document.createElement("div");
                                    element.innerHTML = MarkdownRenderer.renderToHTML(description);
                                    return element;
                                }
                                catch (error) {
                                    if (error instanceof OperationCancelledError) return null;
                                    else throw error;
                                }
                            },
                            apply: (view, completion) => {
                                const cFrom = c.range.position;
                                const cTo = c.range.position + c.range.length;
                                if (c.textType == CompletionItemTextType.snippet)
                                    return snippet(c.text)(view, completion, cFrom, cTo);
                                const insertTransaction = insertCompletionText(view.state, c.text, cFrom, cTo);
                                view.dispatch({
                                    ...insertTransaction,
                                    annotations: pickedCompletion.of(completion)
                                });
                            }
                        };
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
