import { defaultJSONPathOptions, JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { syntaxTree } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { useEffect, useRef } from "react";
import { JSONPathDiagnostics } from "../../../jsonpath-tools/diagnostics";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { jsonPath } from "./codemirror/jsonpath-codemirror/jsonpath-language";
import { getJSONPath } from "./codemirror/jsonpath-codemirror/jsonpath-parser";
import { getResult, updateOptionsEffect, updateQueryArgumentEffect, updateQueryArgumentTypeEffect } from "./codemirror/jsonpath-codemirror/jsonpath-state";
import { LanguageService } from "./codemirror/jsonpath-codemirror/worker/language-service";
import { TextRange } from "@/jsonpath-tools/text-range";
import { rangeHighlighter, setHighlightedRangeEffect } from "./codemirror/range-highlighter";
import { AnyDataType, DataType } from "@/jsonpath-tools/data-types/data-types";

export default function JSONPathEditor({
    value,
    options = defaultJSONPathOptions,
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
    options: JSONPathOptions,
    queryArgument: JSONPathJSONValue | undefined,
    queryArgumentType: DataType,
    languageService: LanguageService,
    highlightedRange: TextRange | null,
    readonly?: boolean,
    onValueChanged: (value: string) => void,
    onParsed?: (jsonPath: JSONPath) => void,
    onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void,
    onGetResultAvailable?: (getResult: () => Promise<{ nodes: readonly JSONPathJSONValue[], paths: readonly (string | number)[][] }>) => void,
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
            jsonPath({
                languageService,
                onDiagnosticsCreated
            }),
            rangeHighlighter(),
            EditorView.theme({
                "&": { fontSize: "18px !important" },
                "& .cm-content": { padding: "10px 2px" }
            }),
            EditorView.updateListener.of(u => {
                if (u.docChanged) {
                    const jsonPath = getJSONPath(syntaxTree(u.view.state));
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
