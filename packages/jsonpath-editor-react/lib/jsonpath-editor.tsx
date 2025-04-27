import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { lintKeymap } from "@codemirror/lint";
import { Compartment, EditorState } from "@codemirror/state";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { crosshairCursor, drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, rectangularSelection } from "@codemirror/view";
import { DefaultLanguageServices, jsonpath, updateOptionsEffect, updateQueryArgumentEffect, updateQueryArgumentTypeEffect } from "@jsonpath-tools/codemirror-lang-jsonpath";
import { AnyDataType, DataType, defaultQueryOptions, JSONValue, QueryOptions } from "@jsonpath-tools/jsonpath";
import { CSSProperties, useEffect, useRef } from "react";
import { libraryHighlightStyle } from "./library-highlight-style";
import { libraryTheme } from "./library-theme";
import classes from "./jsonpath-editor.module.css";

/**
 * JSONPath editor component.
 */
export default function JSONPathEditor({
    value,
    options = defaultQueryOptions,
    queryArgument = undefined,
    queryArgumentType = AnyDataType.create(),
    readonly = false,
    style,
    onValueChanged
}: {
    value: string,
    options: QueryOptions,
    queryArgument: JSONValue | undefined,
    queryArgumentType: DataType,
    readonly?: boolean,
    style?: CSSProperties,
    onValueChanged: (value: string) => void,
}) {
    const editorViewRef = useRef<EditorView>(null);
    const containerElementRef = useRef<HTMLDivElement>(null);
    const valueInEditorRef = useRef("");

    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: updateOptionsEffect.of(options) });
    }, [options]);

    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: updateQueryArgumentEffect.of(queryArgument) });
    }, [queryArgument]);

    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: updateQueryArgumentTypeEffect.of(queryArgumentType) });
    }, [queryArgumentType]);

    useEffect(() => {
        if (editorViewRef.current !== null) {
            editorViewRef.current.dispatch({
                effects: readonlyCompartment.reconfigure(EditorState.readOnly.of(readonly))
            });
        }
    }, [readonly]);

    useEffect(() => {
        const editorView = new EditorView({
            doc: value,
            extensions: [
                lineNumbers(),
                foldGutter(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                highlightSelectionMatches(),
                highlightSpecialChars(),
                drawSelection(),
                dropCursor(),
                bracketMatching(),
                closeBrackets(),
                indentOnInput(),
                history(),
                EditorState.allowMultipleSelections.of(true),
                rectangularSelection(),
                crosshairCursor(),
                autocompletion(),
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                    ...completionKeymap,
                    ...lintKeymap,
                ]),
                indentUnit.of("    "),
                syntaxHighlighting(libraryHighlightStyle),
                readonlyCompartment.of(EditorState.readOnly.of(readonly)),
                EditorView.updateListener.of(u => {
                    if (u.docChanged) {
                        const newValue = u.state.doc.toString();
                        const isFromParent = valueInEditorRef.current === newValue;
                        valueInEditorRef.current = newValue;
                        if (!isFromParent)
                            onValueChanged(newValue);
                    }
                }),
                jsonpath({
                    languageService: DefaultLanguageServices.worker,
                    codeHighlighter: libraryHighlightStyle
                }),
                libraryTheme
            ],
            parent: containerElementRef.current!
        });
        valueInEditorRef.current = value;
        editorViewRef.current = editorView;
        editorView.dispatch({
            effects: [
                updateOptionsEffect.of(options),
                updateQueryArgumentEffect.of(queryArgument),
                updateQueryArgumentTypeEffect.of(queryArgumentType)
            ]
        });

        return () => {
            editorView.destroy();
        };
    }, []);

    if (editorViewRef.current !== null && value !== valueInEditorRef.current) {
        queueMicrotask(() => {
            valueInEditorRef.current = value;
            editorViewRef.current!.dispatch({
                changes: { from: 0, to: editorViewRef.current!.state.doc.length, insert: value },
            });
        });
    }

    return (
        <div ref={containerElementRef} style={style} className={classes.container}></div>
    );
}

const readonlyCompartment = new Compartment();