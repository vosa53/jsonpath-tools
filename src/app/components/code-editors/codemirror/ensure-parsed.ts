import { JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { EditorState, Extension, Facet, StateEffect, StateField } from "@codemirror/state";
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { ensureSyntaxTree, syntaxTreeAvailable } from "@codemirror/language";

export interface EnsureParsedConfig {
    onParsingProgressChanged: (inProgress: boolean) => void;
}

const configFacet = Facet.define<EnsureParsedConfig>();

class JSONPathPlugin implements PluginValue {
    private parseTimeoutId: number | undefined = undefined;

    constructor(private readonly view: EditorView) {
        this.ensureParsed();
    }

    update(update: ViewUpdate): void {
        if (update.docChanged)
            this.ensureParsed();
    }

    destroy(): void {
        if (this.parseTimeoutId !== undefined)
            window.clearTimeout(this.parseTimeoutId);
    }

    private ensureParsed() {
        if (syntaxTreeAvailable(this.view.state, this.view.state.doc.length))
            this.report(false);
        else {
            this.report(true);
            this.scheduleParse();
        }
    }

    private scheduleParse() {
        if (this.parseTimeoutId !== undefined)
            window.clearTimeout(this.parseTimeoutId);
        this.parseTimeoutId = window.setTimeout(() => {
            const tree = ensureSyntaxTree(this.view.state, this.view.state.doc.length, 100);
            if (tree !== null)
                this.report(false);
            else
                this.scheduleParse();
        }, 20);
    }

    private report(inProgress: boolean) {
        const configs = this.view.state.facet(configFacet);
        for (const config of configs)
            config.onParsingProgressChanged(inProgress);
    }

    /*private estimateParsedFraction(): number {
        const MIN_PRECISION = 1 / 10;
        let low = 0;
        let high = 1;
        while (high - low > MIN_PRECISION) {
            const middle = (low + high) / 2;
            if (syntaxTreeAvailable(this.view.state, middle * this.view.state.doc.length))
                low = middle;
            else
                high = middle;
        }
        return (low + high) / 2;
    }*/
}

export function ensureParsed(config: EnsureParsedConfig): Extension {
    return [
        configFacet.of(config),
        ViewPlugin.fromClass(JSONPathPlugin)
    ]
}