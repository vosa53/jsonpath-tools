import { Diagnostics, QueryOptions, TextChange, TextRange } from "@jsonpath-tools/jsonpath";
import { JSONValue } from "@jsonpath-tools/jsonpath";
import { EditorState, Extension, Facet, StateEffect, StateField, Text } from "@codemirror/state";
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { LanguageService } from "./language-service/language-service";
import { LanguageServiceSession } from "./language-service/language-service-session";
import { DataType } from "@jsonpath-tools/jsonpath";
import { NormalizedPath } from "@jsonpath-tools/jsonpath";
import { MarkdownRenderer } from "./markdown-renderer";

export function core(): Extension {
    return [
        jsonPathPlugin
    ];
}

export const updateQueryOptionsEffect = StateEffect.define<QueryOptions>();
export const updateQueryArgumentEffect = StateEffect.define<JSONValue | undefined>();
export const updateQueryArgumentTypeEffect = StateEffect.define<DataType>();
export const languageServiceFacet = Facet.define<LanguageService>();
export const markdownRendererFacet = Facet.define<MarkdownRenderer>();
export const diagnosticsCreatedFacet = Facet.define<(diagnostics: readonly Diagnostics[]) => void>();

export const languageServiceSessionStateField = StateField.define<LanguageServiceSession>({
    create(state) {
        const languageServices = state.facet(languageServiceFacet);
        if (languageServices.length !== 1) throw new Error("Expected exactly one config.");

        const languageServiceSession = languageServices[0].createSession();
        languageServiceSession.updateQuery([new TextChange(new TextRange(0, 0), state.doc.toString())]);
        return languageServiceSession;
    },
    update(languageServiceSession, transaction) {
        if (transaction.docChanged) {
            const textChanges: TextChange[] = [];
            transaction.changes.iterChanges((fromA: number, toA: number, fromB: number, toB: number, inserted: Text) => {
                textChanges.push(new TextChange(new TextRange(fromA, toA - fromA), inserted.toString()));
            });
            languageServiceSession.updateQuery(textChanges);
        }
        for (const effect of transaction.effects) {
            if (effect.is(updateQueryOptionsEffect))
                languageServiceSession.updateQueryOptions(effect.value);
            else if (effect.is(updateQueryArgumentEffect))
                languageServiceSession.updateQueryArgument(effect.value);
            else if (effect.is(updateQueryArgumentTypeEffect))
                languageServiceSession.updateQueryArgumentType(effect.value);
        }
        return languageServiceSession;
    }
});

class JSONPathPlugin implements PluginValue {
    private readonly languageServiceSession: LanguageServiceSession;

    constructor(view: EditorView) {
        this.languageServiceSession = view.state.field(languageServiceSessionStateField);
    }

    update(update: ViewUpdate): void {

    }

    destroy(): void {
        this.languageServiceSession.dispose();
    }
}

const jsonPathPlugin = ViewPlugin.fromClass(JSONPathPlugin, {
    provide(plugin) {
        return languageServiceSessionStateField;
    }
});

export function getResult(state: EditorState): Promise<{ nodes: readonly JSONValue[], paths: readonly NormalizedPath[] }> {
    const languageServiceSession = state.field(languageServiceSessionStateField);
    return languageServiceSession.getResult();
}