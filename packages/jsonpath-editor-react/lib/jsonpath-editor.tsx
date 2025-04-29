import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { lintKeymap } from "@codemirror/lint";
import { Compartment, EditorState } from "@codemirror/state";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { crosshairCursor, drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, rectangularSelection } from "@codemirror/view";
import { DefaultLanguageServices, jsonpath, updateQueryOptionsEffect, updateQueryArgumentEffect, updateQueryArgumentTypeEffect } from "@jsonpath-tools/codemirror-lang-jsonpath";
import { AnyDataType, DataType, defaultQueryOptions, JSONValue, QueryOptions } from "@jsonpath-tools/jsonpath";
import { CSSProperties, useEffect, useRef } from "react";
import { jsonpathEditorHighlightStyle } from "./jsonpath-editor-highlight-style";
import { jsonpathEditorTheme } from "./jsonpath-editor-theme";

/**
 * JSONPath editor compliant with ([RFC 9535](https://datatracker.ietf.org/doc/rfc9535/)).
 */
export default function JSONPathEditor({
    value,
    queryOptions = defaultQueryOptions,
    queryArgument = undefined,
    queryArgumentType = AnyDataType.create(),
    readOnly = false,
    style,
    onValueChange
}: {
    /**
     * Query text.
     */
    value: string,

    /**
     * Query options.
     */
    queryOptions?: QueryOptions,

    /**
     * Query argument.
     */
    queryArgument?: JSONValue | undefined,

    /**
     * Query argument type.
     */
    queryArgumentType?: DataType,

    /**
     * Whether the editor should be read-only.
     */
    readOnly?: boolean,

    /**
     * Inline CSS style.
     */
    style?: CSSProperties,

    /**
     * Called when the query text changes.
     * @param value New query text.
     */
    onValueChange: (value: string) => void
}) {
    const editorViewRef = useRef<EditorView>(null);
    const containerElementRef = useRef<HTMLDivElement>(null);
    const valueInEditorRef = useRef("");

    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: updateQueryOptionsEffect.of(queryOptions) });
    }, [queryOptions]);

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
                effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly))
            });
        }
    }, [readOnly]);

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
                syntaxHighlighting(jsonpathEditorHighlightStyle),
                readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
                EditorView.updateListener.of(u => {
                    if (u.docChanged) {
                        const newValue = u.state.doc.toString();
                        const isFromParent = valueInEditorRef.current === newValue;
                        valueInEditorRef.current = newValue;
                        if (!isFromParent)
                            onValueChange(newValue);
                    }
                }),
                jsonpath({
                    languageService: DefaultLanguageServices.worker,
                    codeHighlighter: jsonpathEditorHighlightStyle
                }),
                jsonpathEditorTheme
            ],
            parent: containerElementRef.current!
        });
        valueInEditorRef.current = value;
        editorViewRef.current = editorView;
        editorView.dispatch({
            effects: [
                updateQueryOptionsEffect.of(queryOptions),
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
        <div ref={containerElementRef} style={style}></div>
    );
}

const readOnlyCompartment = new Compartment();