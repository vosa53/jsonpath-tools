import { JSONPathNormalizedPath } from "@/jsonpath-tools/transformations";
import { logPerformance } from "@/jsonpath-tools/utils";
import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import { EditorState, Range, StateEffect, StateField, Text } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { SyntaxNode, SyntaxNodeRef, Tree, TreeCursor } from "@lezer/common";

const values = new Set(["True", "False", "Null", "Number", "String", "Object", "Array"]);
const arrayContext = ["Array"];

const currentPathDecoration = Decoration.mark({ class: "cm-path-current" });
const pathDecoration = Decoration.mark({ class: "cm-path" });

export const arrayIndexCacheStateField = StateField.define<Map<number, number>>({
    create: state => new Map(),
    update: (value, transaction) => {
        if (transaction.docChanged) value.clear();
        return value;
    }
});

export const updateCurrentPathHighlightEffect = StateEffect.define<JSONPathNormalizedPath>();
export const updatePathsHighlightEffect = StateEffect.define<readonly JSONPathNormalizedPath[]>();

export const matchHighlighter = ViewPlugin.fromClass(class {
    private _decorationSet: DecorationSet;
    private serializedPaths: Set<string> = new Set<string>();
    private serializedCurrentPath = "[]";

    constructor(view: EditorView) {
        this._decorationSet = this.getDecorations(view);
        view.scrollSnapshot()
    }

    get decorationSet(): DecorationSet {
        return this._decorationSet;
    }

    update(update: ViewUpdate) {
        let pathsUpdated = false;
        for (const transaction of update.transactions) {
            for (const effect of transaction.effects) {
                if (effect.is(updatePathsHighlightEffect)) {
                    logPerformance("Serialize", () => {
                        this.serializedPaths = new Set(effect.value.map(p => JSON.stringify(p)));
                        pathsUpdated = true;
                    });
                }
                if (effect.is(updateCurrentPathHighlightEffect)) {
                    this.serializedCurrentPath = JSON.stringify(effect.value);
                    pathsUpdated = true;
                }
            }
        }

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
                        path[path.length - 1] = getArrayIndexAt(node.node.cursor(), view.state);

                    if (values.has(node.name)) {
                        const pathString = JSON.stringify(path);
                        //console.log(node.name, pathString);
                        if (this.serializedCurrentPath === pathString)
                            decorations.push(currentPathDecoration.range(node.from, node.to));
                        else if (this.serializedPaths.has(pathString))
                            decorations.push(pathDecoration.range(node.from, node.to));
                    }

                    if (node.name === "Property") {
                        const propertyNameNode = node.node.firstChild!; // TODO: return false
                        if (propertyNameNode === null || propertyNameNode.name !== "PropertyName") return false;
                        path.push(JSON.parse(view.state.doc.sliceString(propertyNameNode.from, propertyNameNode.to))); // TODO: Invalid property name.
                    }
                    else if (node.name === "Array") path.push(-1);
                },
                leave: (node) => {
                    if (values.has(node.name) && node.matchContext(arrayContext)) (path[path.length - 1] as number)++;

                    if (node.name === "Property") path.pop();
                    else if (node.name === "Array") path.pop();

                }
            });
        }
        const result = Decoration.set(decorations);
        const elapsed = performance.now() - start;
        console.log("Highlighting took", elapsed, "ms");
        return result;
    }
}, {
    decorations: v => v.decorationSet,
    provide: v => arrayIndexCacheStateField
});

function getArrayIndexAt(cursor: TreeCursor, state: EditorState): number {
    const arrayIndexCache = state.field(arrayIndexCacheStateField);
    const startingPosition = cursor.from;
    let index = 0;
    let endIndex = 0;
    while (cursor.prevSibling()) {
        const isValue = values.has(cursor.name);
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
        const isValue = values.has(cursor.name);
        if (isValue) {
            arrayIndexCache.set(cursor.from, endIndex);
            endIndex++;
        }
        cursor.nextSibling();
    }
    return index;
}

export function getPathAt(cursor: TreeCursor, state: EditorState): JSONPathNormalizedPath {
    const path: JSONPathNormalizedPath = [];

    while (!values.has(cursor.name) && cursor.parent());

    do {
        if (cursor.name === "Property") {
            cursor.firstChild();
            const nameString = state.doc.sliceString(cursor.from, cursor.to);
            const name = JSON.parse(nameString); // TODO: Invalid property name.
            path.push(name);
            cursor.parent();
        }
        if (cursor.matchContext(arrayContext)) {
            const index = getArrayIndexAt(cursor, state);
            path.push(index);
        }
    } while (cursor.parent());
    path.reverse();
    return path;
}

export function getNodeAtPath(path: JSONPathNormalizedPath, state: EditorState): SyntaxNode | null {
    const cursor = syntaxTree(state).cursor();
    cursor.firstChild();
    for (const pathSegment of path) {
        if (cursor.name === "Object" && typeof pathSegment === "string") {
            cursor.firstChild();
            while (!isPropertyWithName(cursor, state.doc, pathSegment)) {
                if (!cursor.nextSibling()) return null;
            }
            cursor.firstChild();
            while (!values.has(cursor.name)) {
                if (!cursor.nextSibling()) return null;
            }
        }
        else if (cursor.name === "Array" && typeof pathSegment === "number") {
            cursor.firstChild();
            let index = -1;
            while (true) {
                if (values.has(cursor.name)) index++;
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

function isPropertyWithName(cursor: TreeCursor, document: Text, name: string): boolean {
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
