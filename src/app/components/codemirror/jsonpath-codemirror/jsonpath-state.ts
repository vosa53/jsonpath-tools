import { JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { Facet, StateEffect, StateField } from "@codemirror/state";
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { WorkerFrontend } from "./worker/worker-frontend";

/*interface JSONPathEditorState {
    readonly worker: JSONPathWorkerFrontend;
    readonly options: JSONPathOptions;
    readonly queryArgument: JSONPathJSONValue;
}*/

export const updateOptionsEffect = StateEffect.define<JSONPathOptions>();
export const updateQueryArgumentEffect = StateEffect.define<JSONPathJSONValue>();
const configFacet = Facet.define<{ a: string }>();

export const workerStateField = StateField.define<WorkerFrontend>({
    create(state) {
        const worker = WorkerFrontend.connectNew();
        worker.updateQuery(state.doc.toString());
        return worker;
    },
    update(value, transaction) {
        if (transaction.docChanged) {
            value.updateQuery(transaction.newDoc.toString());
        }
        for (const effect of transaction.effects) {
            /*if (effect.is(updateOptionsEffect))
                value.updateOption(effect.value);
            else */if (effect.is(updateQueryArgumentEffect)) {
                console.log("UPDATE QUERY ARGUMENT", effect.value);
                value.updateQueryArgument(effect.value);
            }
        }

        return value;
    }
});

class JSONPathPlugin implements PluginValue {
    private readonly worker: WorkerFrontend;

    constructor(private readonly view: EditorView) {
        this.worker = view.state.field(workerStateField);
        /*this.worker.updateDiagnostics = diagnostics => {
            const bb = view.state.facet(configFacet);
            console.log("Received diagnostics", diagnostics);
        };*/
        // TODO: Result.
    }

    update(update: ViewUpdate): void {

    }

    destroy(): void {
        this.worker.dispose();
    }
}

export const jsonPathPlugin = ViewPlugin.fromClass(JSONPathPlugin, {
    provide(plugin) {
        return workerStateField;
    },
});
