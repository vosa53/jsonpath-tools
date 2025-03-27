import { NormalizedPath } from "@/jsonpath-tools/normalized-path";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { syntaxTree } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { StateEffect } from "@codemirror/state";
import { EditorView } from "codemirror";
import { FocusEventHandler, useEffect, useRef } from "react";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { getNodeAtPath, getPathAtTreeCursor, pathsHighlighter, setCurrentHighlightedPathEffect, setHighlightedPathsEffect } from "./codemirror/paths-highlighter";
import { EMPTY_ARRAY, logPerformance } from "@/jsonpath-tools/helpers/utils";
import { ensureParsed } from "./codemirror/ensure-parsed";

export default function JSONEditor({
    value,
    readonly = false,
    paths = EMPTY_ARRAY,
    currentPath = EMPTY_ARRAY,
    onValueChanged,
    onCurrentPathChanged,
    onParsingProgressChanged,
    onFocus,
    onBlur
}: {
    value: string,
    readonly?: boolean,
    paths?: readonly NormalizedPath[],
    currentPath?: NormalizedPath,
    onValueChanged: (value: string) => void,
    onCurrentPathChanged?: (currentPathGetter: () => NormalizedPath) => void,
    onParsingProgressChanged?: (inProgress: boolean) => void,
    onFocus?: FocusEventHandler<HTMLElement>,
    onBlur?: FocusEventHandler<HTMLElement>
}) {
    const editorViewRef = useRef<EditorView>(null);

    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: setHighlightedPathsEffect.of(paths) });
    }, [paths]);

    useEffect(() => {
        if (editorViewRef.current !== null) {
            logPerformance("Change current highlighted path", () => {
                const effects: StateEffect<any>[] = [setCurrentHighlightedPathEffect.of(currentPath)];
                const node = getNodeAtPath(currentPath, editorViewRef.current!.state);
                if (node !== null) effects.push(EditorView.scrollIntoView(node.from, { y: "center" }));
                editorViewRef.current!.dispatch({ effects });
            });
        }
    }, [currentPath]);

    const onEditorExtensionsRequested = () => {
        return [
            json(),
            linter(jsonParseLinter()), // TODO: Disable in readonly editor.
            pathsHighlighter(),
            ensureParsed({ onParsingProgressChanged: (inProgress: boolean) => onParsingProgressChanged?.(inProgress) }),
            EditorView.updateListener.of(u => {
                if (onCurrentPathChanged !== undefined && u.selectionSet) {
                    onCurrentPathChanged(() => {
                        const tree = syntaxTree(u.state);
                        const cursor = tree.cursorAt(u.state.selection.main.head);
                        return getPathAtTreeCursor(cursor, u.state);
                    });
                }
            })
        ];
    };

    const onEditorViewCreated = (view: EditorView) => {
        view.dispatch({ effects: [setHighlightedPathsEffect.of(paths), setCurrentHighlightedPathEffect.of(currentPath)] });
        editorViewRef.current = view;
    };

    return (
        <CodeMirrorEditor
            value={value}
            readonly={readonly}
            style={{ height: "100%" }}
            onValueChanged={onValueChanged}
            onExtensionsRequested={onEditorExtensionsRequested}
            onEditorViewCreated={onEditorViewCreated}
            onFocus={onFocus}
            onBlur={onBlur} />
    );
}
