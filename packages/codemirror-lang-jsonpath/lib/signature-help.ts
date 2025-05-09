import { Signature } from "@jsonpath-tools/jsonpath";
import { EditorState, Extension, StateEffect, StateField, Transaction } from "@codemirror/state";
import { Command, EditorView, keymap, showTooltip, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { OperationCancelledError } from "./cancellation-token";
import { languageServiceSessionStateField, markdownRendererFacet } from "./core";
import { MarkdownRenderer } from "./markdown-renderer";

/**
 * CodeMirror extension adding JSONPath signature help.
 */
export function signatureHelp(): Extension {
    return [
        signatureHelpPlugin,
        signatureHelpBaseTheme
    ];
}

/**
 * CodeMirror command to explicity start signature help.
 */
export const startSignatureHelp: Command = view => {
    view.dispatch({ effects: startSignatureHelpEffect.of(true) });
    return true;
};

/**
 * Default CodeMirror keymap for JSONPath signature help using `Ctrl+Shift+Space`.
 */
export const signatureHelpKeymap = keymap.of([
    { key: "Ctrl-Shift-Space", run: startSignatureHelp }
]);

const startSignatureHelpEffect = StateEffect.define<boolean>();
const setSignatureEffect = StateEffect.define<Signature | null>();

const signatureStateField = StateField.define<Signature | null>({
    create(state) {
        return null;
    },

    update(signature, transaction) {
        for (const effect of transaction.effects) {
            if (effect.is(setSignatureEffect))
                return effect.value;
        }
        return signature;
    },

    provide: f => showTooltip.compute([f], state => {
        const currentSignature = state.field(f);
        if (currentSignature === null)
            return null;
        else
            return {
                pos: state.selection.main.head,
                end: state.selection.main.head,
                above: true,
                create: (view) => {
                    const markdownRenderer = view.state.facet(markdownRendererFacet)[0];
                    return {
                        dom: createElementForSignature(currentSignature, markdownRenderer)
                    };
                }
            };
    })
});

const signatureHelpPlugin = ViewPlugin.fromClass(class {
    constructor(private readonly view: EditorView) {
    }

    update(update: ViewUpdate) {
        const currentSignature = update.view.state.field(signatureStateField);
        const wasChange = update.docChanged || update.transactions.some(t => t.startState.selection.main.head !== t.state.selection.main.head);
        if (wasChange && currentSignature !== null || update.transactions.some(t => isTransactionTriggeringSignatureHelp(t)))
            this.updateSignature(update.state);
    }

    private async updateSignature(state: EditorState): Promise<void> {
        const languageServiceSession = state.field(languageServiceSessionStateField);
        try {
            const signature = await languageServiceSession.getSignature(state.selection.main.head);
            this.view.dispatch({ effects: setSignatureEffect.of(signature) });
        }
        catch (error) {
            if (!(error instanceof OperationCancelledError))
                throw error;
        }
    }
}, {
    provide: v => signatureStateField
});

function isTransactionTriggeringSignatureHelp(transaction: Transaction): boolean {
    if (transaction.effects.some(e => e.is(startSignatureHelpEffect)))
        return true;
    if (!transaction.docChanged || !transaction.isUserEvent("input.type") || transaction.changes.empty)
        return false;

    let typedCharacter = "";
    transaction.changes.iterChanges((fromA, toB, fromB, toA, text) => typedCharacter = text.toString());
    if (typedCharacter.length > 1) typedCharacter = typedCharacter[0];

    return typedCharacter === "(" || typedCharacter === ",";
}

function createElementForSignature(signature: Signature, markdownRenderer: MarkdownRenderer): HTMLElement {
    const tooltipElement = document.createElement("div");
    tooltipElement.classList.add("cmjp-tooltip-signatureHelp");
    const signatureElement = document.createElement("div");
    signatureElement.classList.add("cmjp-tooltip-signatureHelp-signature");
    tooltipElement.appendChild(signatureElement);
    if (signature.activeParameterIndex < signature.parameters.length) {
        const activeParameter = signature.parameters[signature.activeParameterIndex];

        const beforeActiveParameterElement = document.createElement("span");
        beforeActiveParameterElement.textContent = signature.text.substring(0, activeParameter.rangeInSignatureText.position);
        signatureElement.appendChild(beforeActiveParameterElement);

        const activeParameterElement = document.createElement("span");
        activeParameterElement.classList.add("cmjp-activeParameter");
        activeParameterElement.textContent = signature.text.substring(activeParameter.rangeInSignatureText.position, activeParameter.rangeInSignatureText.position + activeParameter.rangeInSignatureText.length);
        signatureElement.appendChild(activeParameterElement);

        const afterActiveParameterElement = document.createElement("span");
        afterActiveParameterElement.textContent = signature.text.substring(activeParameter.rangeInSignatureText.position + activeParameter.rangeInSignatureText.length);
        signatureElement.appendChild(afterActiveParameterElement);

        const activeParameterDocumentationElement = document.createElement("div");
        activeParameterDocumentationElement.innerHTML = markdownRenderer.renderToHTML(activeParameter.documentation);
        tooltipElement.appendChild(activeParameterDocumentationElement);
    }
    else
        signatureElement.textContent = signature.text;
    return tooltipElement;
}

const signatureHelpBaseTheme = EditorView.baseTheme({
    "& .cmjp-activeParameter": { textDecoration: "underline" }
});
