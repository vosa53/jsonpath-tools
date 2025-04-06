import { NormalizedPath, NormalizedPathSegment } from "@/jsonpath-tools/normalized-path";
import { logPerformance } from "@/jsonpath-tools/helpers/utils";
import { syntaxTree } from "@codemirror/language";
import { EditorState, Extension, Range, StateEffect, StateField, Text } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { SyntaxNode, TreeCursor } from "@lezer/common";

/**
 * CodeMirror extension to highlight JSON values at given paths.
 */
export function jsonValueHighlighter(): Extension {
    return [
        jsonValueHighlighterPlugin,
        jsonValueHighlighterBaseTheme
    ];
}

/**
 * State effect to set a path to a JSON value that should be highlighted as current.
 */
export const setCurrentHighlightedValuePathEffect = StateEffect.define<NormalizedPath>();

/**
 * State effect to set paths to JSON values that should be highlighted.
 */
export const setHighlightedValuesPathsEffect = StateEffect.define<readonly NormalizedPath[]>();

/**
 * Returns path to the JSON value at the given tree cursor.
 * @param cursor Tree cursor.
 * @param state Editor state.
 */
export function getPathAtTreeCursor(cursor: TreeCursor, state: EditorState): NormalizedPath {
    const path: NormalizedPathSegment[] = [];

    while (!valueNodeNames.has(cursor.name) && cursor.parent());

    do {
        if (cursor.name === "Property") {
            cursor.firstChild();
            const nameString = state.doc.sliceString(cursor.from, cursor.to);
            const name = JSON.parse(nameString); // TODO: Invalid property name.
            path.push(name);
            cursor.parent();
        }
        if (cursor.matchContext(inArrayContext)) {
            const index = getArrayIndexAtTreeCursor(cursor, state);
            path.push(index);
        }
    } while (cursor.parent());
    path.reverse();
    return path;
}

/**
 * Returns the JSON syntax node for the given path or `null` when there is no syntax node at the given path.
 * @param path Path.
 * @param state Editor state.
 */
export function getNodeAtPath(path: NormalizedPath, state: EditorState): SyntaxNode | null {
    const cursor = syntaxTree(state).cursor();
    cursor.firstChild();
    for (const pathSegment of path) {
        if (cursor.name === "Object" && typeof pathSegment === "string") {
            cursor.firstChild();
            while (!isPropertyWithNameAtTreeCursor(cursor, state.doc, pathSegment)) {
                if (!cursor.nextSibling()) return null;
            }
            cursor.firstChild();
            while (!valueNodeNames.has(cursor.name)) {
                if (!cursor.nextSibling()) return null;
            }
        }
        else if (cursor.name === "Array" && typeof pathSegment === "number") {
            cursor.firstChild();
            let index = -1;
            while (true) {
                if (valueNodeNames.has(cursor.name)) index++;
                if (index < pathSegment) {
                    if (!cursor.nextSibling()) return null;
                }
                else break;
            }
        }
        else return null;
    }
    return cursor.node;
}

const valueNodeNames = new Set(["True", "False", "Null", "Number", "String", "Object", "Array"]);
const inArrayContext = ["Array"];

const currentHighlightedValueDecoration = Decoration.mark({ class: "cmjpp-highlighted-json-value-current" });
const highlightedValueDecoration = Decoration.mark({ class: "cmjpp-highlighted-json-value" });

const arrayIndexCacheStateField = StateField.define<Map<number, number>>({
    create: state => new Map(),
    update: (value, transaction) => {
        if (transaction.docChanged) value.clear();
        return value;
    }
});

const jsonValueHighlighterPlugin = ViewPlugin.fromClass(class {
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
                if (effect.is(setHighlightedValuesPathsEffect)) {
                    logPerformance("Serialize result paths for highlighting", () => {
                        this.serializedPaths = new Set(effect.value.map(p => JSON.stringify(p)));
                        pathsUpdated = true;
                    });
                }
                if (effect.is(setCurrentHighlightedValuePathEffect)) {
                    this.serializedCurrentPath = JSON.stringify(effect.value);
                    pathsUpdated = true;
                }
            }
        }

        if (update.docChanged || update.viewportChanged || pathsUpdated) this._decorationSet = this.getDecorations(update.view);
    }

    getDecorations(view: EditorView) {
        return logPerformance("Highlighting result paths", () => {
            if (this.serializedPaths.size === 0) return Decoration.none;
            const tree = syntaxTree(view.state);
            const decorations: Range<Decoration>[] = [];
            for (const visibleRange of view.visibleRanges) {
                const path: NormalizedPathSegment[] = [];

                tree.iterate({
                    from: visibleRange.from,
                    to: visibleRange.to,
                    enter: (node) => {
                        if (path.length !== 0 && path[path.length - 1] === -1)
                            path[path.length - 1] = getArrayIndexAtTreeCursor(node.node.cursor(), view.state);

                        if (valueNodeNames.has(node.name)) {
                            const pathString = JSON.stringify(path);
                            if (this.serializedCurrentPath === pathString)
                                decorations.push(currentHighlightedValueDecoration.range(node.from, node.to));
                            else if (this.serializedPaths.has(pathString))
                                decorations.push(highlightedValueDecoration.range(node.from, node.to));
                        }

                        if (node.name === "Property") {
                            const propertyNameNode = node.node.firstChild!; // TODO: return false
                            if (propertyNameNode === null || propertyNameNode.name !== "PropertyName") return false;
                            path.push(JSON.parse(view.state.doc.sliceString(propertyNameNode.from, propertyNameNode.to))); // TODO: Invalid property name.
                        }
                        else if (node.name === "Array") path.push(-1);
                    },
                    leave: (node) => {
                        if (valueNodeNames.has(node.name) && node.matchContext(inArrayContext)) (path[path.length - 1] as number)++;

                        if (node.name === "Property") path.pop();
                        else if (node.name === "Array") path.pop();

                    }
                });
            }
            return Decoration.set(decorations);
        });
    }
}, {
    decorations: v => v.decorationSet,
    provide: v => arrayIndexCacheStateField
});

function getArrayIndexAtTreeCursor(cursor: TreeCursor, state: EditorState): number {
    const arrayIndexCache = state.field(arrayIndexCacheStateField);
    const startingPosition = cursor.from;
    let index = 0;
    let endIndex = 0;
    while (cursor.prevSibling()) {
        const isValue = valueNodeNames.has(cursor.name);
        if (isValue) {
            index++;
            const cachedIndex = arrayIndexCache.get(cursor.from);
            if (cachedIndex !== undefined) {
                index += cachedIndex;
                endIndex = cachedIndex;
                break;
            }
        }
    }
    while (cursor.from !== startingPosition) {
        const isValue = valueNodeNames.has(cursor.name);
        if (isValue) {
            arrayIndexCache.set(cursor.from, endIndex);
            endIndex++;
        }
        cursor.nextSibling();
    }
    return index;
}

function isPropertyWithNameAtTreeCursor(cursor: TreeCursor, document: Text, name: string): boolean {
    if (cursor.name !== "Property") return false;
    cursor.firstChild();
    // @ts-ignore
    if (cursor.name !== "PropertyName") {
        cursor.parent();
        return false;
    }
    const foundNameString = document.sliceString(cursor.from, cursor.to);
    const foundName = JSON.parse(foundNameString); // TODO: Invalid property name.
    cursor.parent();
    return foundName === name;
}

const jsonValueHighlighterBaseTheme = EditorView.baseTheme({
    "& .cmjpp-highlighted-json-value": { background: "yellow" },
    "& .cmjpp-highlighted-json-value-current": { background: "orange" }
});
