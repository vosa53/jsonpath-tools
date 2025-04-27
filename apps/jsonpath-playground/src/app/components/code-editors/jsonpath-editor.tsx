import { defaultQueryOptions, QueryOptions } from "@jsonpath-tools/jsonpath";
import { Query } from "@jsonpath-tools/jsonpath";
import { JSONValue } from "@jsonpath-tools/jsonpath";
import { syntaxTree } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { useEffect, useRef } from "react";
import { Diagnostics } from "@jsonpath-tools/jsonpath";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { jsonpath } from "@jsonpath-tools/codemirror-lang-jsonpath";
import { getQueryForTree } from "@jsonpath-tools/codemirror-lang-jsonpath";
import { getResult, updateOptionsEffect, updateQueryArgumentEffect, updateQueryArgumentTypeEffect } from "@jsonpath-tools/codemirror-lang-jsonpath";
import { LanguageService } from "@jsonpath-tools/codemirror-lang-jsonpath";
import { TextRange } from "@jsonpath-tools/jsonpath";
import { textRangeHighlighter, setHighlightedRangeEffect } from "./codemirror/text-range-highlighter";
import { AnyDataType, DataType } from "@jsonpath-tools/jsonpath";
import { NormalizedPath } from "@jsonpath-tools/jsonpath";
import { applicationHighlightStyle } from "./codemirror/application-highlight-style";

/**
 * JSONPath editor component.
 */
export default function JSONPathEditor({
    value,
    options = defaultQueryOptions,
    queryArgument = undefined,
    queryArgumentType = AnyDataType.create(),
    highlightedRange = null,
    languageService,
    readonly = false,
    onValueChanged,
    onParsed,
    onDiagnosticsCreated,
    onGetResultAvailable,
    onRun
}: {
    value: string,
    options: QueryOptions,
    queryArgument: JSONValue | undefined,
    queryArgumentType: DataType,
    languageService: LanguageService,
    highlightedRange: TextRange | null,
    readonly?: boolean,
    onValueChanged: (value: string) => void,
    onParsed?: (jsonPath: Query) => void,
    onDiagnosticsCreated?: (diagnostics: readonly Diagnostics[]) => void,
    onGetResultAvailable?: (getResult: () => Promise<{ nodes: readonly JSONValue[], paths: readonly NormalizedPath[] }>) => void,
    onRun?: () => void
}) {
    const editorViewRef = useRef<EditorView>(null);

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
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: setHighlightedRangeEffect.of(highlightedRange) });
    }, [highlightedRange]);

    const currentOnRun = useRef<() => void>(undefined);
    currentOnRun.current = onRun;

    const onEditorExtensionsRequested = () => {
        return [
            jsonpath({
                languageService,
                codeHighlighter: applicationHighlightStyle,
                onDiagnosticsCreated
            }),
            textRangeHighlighter(),
            EditorView.theme({
                "&": { fontSize: "18px !important" },
                "& .cm-content": { padding: "10px 2px" }
            }),
            EditorView.updateListener.of(u => {
                if (u.docChanged) {
                    const jsonPath = getQueryForTree(syntaxTree(u.view.state));
                    onParsed?.(jsonPath);
                }
            }),
            Prec.highest(keymap.of([
                {
                    key: "Ctrl-Enter",
                    run: () => {
                        currentOnRun.current?.();
                        return true;
                    }
                }
            ]))
        ];
    };

    const onEditorViewCreated = (view: EditorView) => {
        view.dispatch({
            effects: [
                updateOptionsEffect.of(options),
                updateQueryArgumentEffect.of(queryArgument),
                updateQueryArgumentTypeEffect.of(queryArgumentType),
                setHighlightedRangeEffect.of(highlightedRange)
            ]
        });
        editorViewRef.current = view;
        onGetResultAvailable?.(() => getResult(view.state));
    };

    return (
        <CodeMirrorEditor
            value={value}
            readonly={readonly}
            onValueChanged={onValueChanged}
            onExtensionsRequested={onEditorExtensionsRequested}
            onEditorViewCreated={onEditorViewCreated}
            style={{ maxHeight: "150px", flex: "1 1 0", overflow: "hidden" }} />
    );
}
