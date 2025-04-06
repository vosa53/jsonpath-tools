import { ensureSyntaxTree, syntaxTreeAvailable } from "@codemirror/language";
import { Extension, Facet } from "@codemirror/state";
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";

/**
 * CodeMirror extension that ensures that the document is always parsed whole. Normally CodeMirror parses only until a timeout is reached.
 * @param config Configuration.
 */
export function ensureParsed(config: EnsureParsedConfig): Extension {
    return [
        ensureParsedConfigFacet.of(config),
        ViewPlugin.fromClass(EnsureParsedPlugin)
    ];
}

/**
 * Configuration for {@link ensureParsed} extension.
 */
export interface EnsureParsedConfig {
    /**
     * Callback to listen for parsing progress changes.
     * @param inProgress Whether the parsing is in progress.
     */
    onParsingProgressChanged: (inProgress: boolean) => void;
}

const ensureParsedConfigFacet = Facet.define<EnsureParsedConfig>();

class EnsureParsedPlugin implements PluginValue {
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
        const configs = this.view.state.facet(ensureParsedConfigFacet);
        for (const config of configs)
            config.onParsingProgressChanged(inProgress);
    }
}
