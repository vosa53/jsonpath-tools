import { JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { EditorState, Facet, StateEffect, StateField } from "@codemirror/state";
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { LanguageServiceSession } from "./worker/language-service-session";
import { LanguageService } from "./worker/language-service";


export const updateOptionsEffect = StateEffect.define<JSONPathOptions>();
export const updateQueryArgumentEffect = StateEffect.define<JSONPathJSONValue>();
export const updateQueryArgumentSchemaEffect = StateEffect.define<JSONPathJSONValue | undefined>();
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
            else if (effect.is(updateQueryArgumentSchemaEffect))
                languageServiceSession.updateQueryArgumentSchema(effect.value);
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

export const jsonPathPlugin = ViewPlugin.fromClass(JSONPathPlugin, {
    provide(plugin) {
        return languageServiceSessionStateField;
    },
});

export function getResult(state: EditorState): Promise<{ nodes: readonly JSONPathJSONValue[], paths: readonly (string | number)[][] }> {
    const languageServiceSession = state.field(languageServiceSessionStateField);
    return languageServiceSession.getResult();
}