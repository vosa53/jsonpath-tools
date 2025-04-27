import { CompletionItemTextType, CompletionItemType } from "@jsonpath-tools/jsonpath";
import { Completion, CompletionContext, CompletionSource, insertCompletionText, pickedCompletion, snippet } from "@codemirror/autocomplete";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField, markdownRendererFacet } from "./core";

/**
 * CodeMirror completion source for JSONPath.
 */
export function completionSource(): CompletionSource {
    return async (context: CompletionContext) => {
        if (context.explicit || context.matchBefore(TRIGGER_REGEX)) {
            const completedRange = context.matchBefore(RANGE_REGEX);
            const languageServiceSession = context.state.field(languageServiceSessionStateField);
            const markdownRenderer = context.state.facet(markdownRendererFacet)[0];
            try {
                const completions = await languageServiceSession.getCompletions(context.pos);

                return {
                    from: completedRange!.from,
                    options: completions.map((c, i) => {
                        const completion: Completion = {
                            label: c.label,
                            type: convertCompletionItemTypeToCodemirrorType(c.type),
                            detail: c.detail,
                            info: async () => {
                                try {
                                    const description = await languageServiceSession.resolveCompletion(i);
                                    const element = document.createElement("div");
                                    element.innerHTML = markdownRenderer.renderToHTML(description);
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

const TRIGGER_REGEX = /[a-zA-Z0-9_\u0080-\uFFFF]|\.|\[|\(|(==|!=|<|>|<=|>=|,)\s|"|'|\?/;
const RANGE_REGEX = /[a-zA-Z0-9_\u0080-\uFFFF"']*/;

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
