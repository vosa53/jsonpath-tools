import { QueryOptions } from "@/jsonpath-tools/options";
import { JSONValue } from "@/jsonpath-tools/json/json-types";
import { EditorState, Extension, Facet, StateEffect, StateField } from "@codemirror/state";
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { LanguageService } from "./worker/language-service";
import { LanguageServiceSession } from "./worker/language-service-session";
import { DataType } from "@/jsonpath-tools/data-types/data-types";
import { NormalizedPath } from "@/jsonpath-tools/normalized-path";

export function jsonPathState(): Extension {
    return [
        jsonPathPlugin
    ];
}

export const updateOptionsEffect = StateEffect.define<QueryOptions>();
export const updateQueryArgumentEffect = StateEffect.define<JSONValue | undefined>();
export const updateQueryArgumentTypeEffect = StateEffect.define<DataType>();
export const jsonPathConfigFacet = Facet.define<{
    languageService: LanguageService
}>();

export const languageServiceSessionStateField = StateField.define<LanguageServiceSession>({
    create(state) {
        const configFacet = state.facet(jsonPathConfigFacet);
        if (configFacet.length !== 1) throw new Error("Expected exactly one config.");

        const languageServiceSession = configFacet[0].languageService.createSession();
        languageServiceSession.updateQuery(state.doc.toString());
        return languageServiceSession;
    },
    update(languageServiceSession, transaction) {
        if (transaction.docChanged)
            languageServiceSession.updateQuery(transaction.newDoc.toString());
        for (const effect of transaction.effects) {
            if (effect.is(updateOptionsEffect))
                languageServiceSession.updateOptions(effect.value);
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

    constructor(private readonly view: EditorView) {
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