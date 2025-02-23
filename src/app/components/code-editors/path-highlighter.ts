import { JSONPathNormalizedPath } from "@/jsonpath-tools/transformations";
import { logPerformance } from "@/jsonpath-tools/utils";
import { ensureSyntaxTree } from "@codemirror/language";
import { Range, StateEffect, Text } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { TreeCursor } from "@lezer/common";

const values = new Set(["True", "False", "Null", "Number", "String", "Object", "Array"]);
const arrayContext = ["Array"];

const currentPathDecoration = Decoration.mark({ class: "cm-path-current" });
const pathDecoration = Decoration.mark({ class: "cm-path" });

export const updatePathsHighlightEffect = StateEffect.define<{ paths: readonly JSONPathNormalizedPath[], currentPath: JSONPathNormalizedPath }>();

export const matchHighlighter = ViewPlugin.fromClass(class {
    private readonly indexCache = new Map<number, number>();
    private _decorationSet: DecorationSet;
    private serializedPaths: Set<string> = new Set<string>();
    private serializedCurrentPath = "[]";

    constructor(view: EditorView) {
        this._decorationSet = this.getDecorations(view);
    }

    get decorationSet(): DecorationSet {
        return this._decorationSet;
    }

    update(update: ViewUpdate) {
        let pathsUpdated = false;
        for (const transaction of update.transactions) {
            for (const effect of transaction.effects) {
                if (effect.is(updatePathsHighlightEffect)) {
                    this.serializedPaths = new Set(effect.value.paths.map(path => JSON.stringify(path)));
                    this.serializedCurrentPath = JSON.stringify(effect.value.currentPath);
                    pathsUpdated = true;
                }
            }
        }

        if (update.docChanged) this.indexCache.clear();
        if (update.docChanged || update.viewportChanged || pathsUpdated) this._decorationSet = this.getDecorations(update.view);
    }

    getDecorations(view: EditorView) {
        if (this.serializedPaths.size === 0) return Decoration.none;
        const start = performance.now();
        const tree = ensureSyntaxTree(view.state, view.state.doc.length, Number.POSITIVE_INFINITY)!;
        //const tree = syntaxTree(view.state);
        const decorations: Range<Decoration>[] = [];
        for (const visibleRange of view.visibleRanges) {
            const path: JSONPathNormalizedPath = [];

            tree.iterate({
                from: visibleRange.from,
                to: visibleRange.to,
                enter: (node) => {
                    if (path.length !== 0 && path[path.length - 1] === -1)
                        path[path.length - 1] = this.getArrayIndexAt(node.node.cursor());

                    if (values.has(node.name)) {
                        const pathString = JSON.stringify(path);
                        if (this.serializedCurrentPath === pathString)
                            decorations.push(currentPathDecoration.range(node.from, node.to));
                        else if (this.serializedPaths.has(pathString))
                            decorations.push(pathDecoration.range(node.from, node.to));
                    }

                    if (node.name === "PropertyName")
                        path.push(JSON.parse(view.state.doc.sliceString(node.from, node.to))); // TODO: Invalid property name.
                    else if (node.name === "Array") path.push(-1);
                },
                leave: (node) => {
                    if (node.name === "Property") path.pop();
                    else if (node.name === "Array") path.pop();

                    if (values.has(node.name) && node.matchContext(arrayContext)) (path[path.length - 1] as number)++;
                }
            });
        }
        const result = Decoration.set(decorations);
        const elapsed = performance.now() - start;
        console.log("Highlighting took", elapsed, "ms");
        return result;
    }

    private getArrayIndexAt(cursor: TreeCursor): number {
        const startingPosition = cursor.from;
        let index = 0;
        let endIndex = 0;
        while (cursor.prevSibling()) {
            const isValue = values.has(cursor.name);
            if (isValue) {
                index++;
                const cachedIndex = this.indexCache.get(cursor.from);
                if (cachedIndex !== undefined) {
                    index += cachedIndex;
                    endIndex = cachedIndex;
                    break;
                }
            }
        }
        while (cursor.from !== startingPosition) {
            const isValue = values.has(cursor.name);
            if (isValue) {
                endIndex++;
                this.indexCache.set(cursor.from, endIndex);
            }
            cursor.nextSibling();
        }
        return index;
    }
}, {
    decorations: v => v.decorationSet
});

function getPathAt(cursor: TreeCursor, document: Text): JSONPathNormalizedPath {
    const path: JSONPathNormalizedPath = [];
    let lastPosition = cursor.from;
    logPerformance("array index", () => {
        while (cursor.parent()) {
            if (cursor.name === "Property") {
                cursor.firstChild();
                const nameString = document.sliceString(cursor.from, cursor.to);
                const name = JSON.parse(nameString); // TODO: Invalid property name.
                path.push(name);
                cursor.parent();
            }
            if (cursor.name === "Array") {
                cursor.firstChild();
                let index = 0;
                while (cursor.from !== lastPosition) {
                    if (values.has(cursor.name)) {
                        index++;
                    }
                    cursor.nextSibling();
                }
                path.push(index);
                cursor.parent();
            }
            lastPosition = cursor.from;
        }
    });
    path.reverse();
    return path;
}