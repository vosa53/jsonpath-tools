import { defaultJSONPathOptions, JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { syntaxTree } from "@codemirror/language";
import { EditorView } from "codemirror";
import { useEffect, useRef } from "react";
import { JSONPathDiagnostics } from "../../../jsonpath-tools/diagnostics";
import CodeMirrorEditor from "./codemirror/codemirror-editor";
import { jsonPath } from "./codemirror/jsonpath-codemirror/jsonpath-language";
import { getJSONPath } from "./codemirror/jsonpath-codemirror/jsonpath-parser";
import { getResult, updateOptionsEffect, updateQueryArgumentEffect, updateQueryArgumentSchemaEffect } from "./codemirror/jsonpath-codemirror/jsonpath-state";
import { LanguageService } from "./codemirror/jsonpath-codemirror/worker/language-service";
import { TextRange } from "@/jsonpath-tools/text-range";
import { rangeHighlighter, setHighlightedRangeEffect } from "./codemirror/range-highlighter";
import { RawJSONSchema } from "@/jsonpath-tools/editor-services/helpers/raw-json-schema";

export default function JSONPathEditor({
    value,
    options = defaultJSONPathOptions,
    queryArgument = undefined,
    queryArgumentSchema = undefined,
    highlightedRange = null,
    languageService,
    readonly = false,
    onValueChanged,
    onParsed,
    onDiagnosticsCreated,
    onGetResultAvailable
}: {
    value: string,
    options: JSONPathOptions,
    queryArgument: JSONPathJSONValue | undefined,
    queryArgumentSchema: RawJSONSchema | undefined,
    languageService: LanguageService,
    highlightedRange: TextRange | null,
    readonly?: boolean,
    onValueChanged: (value: string) => void,
    onParsed?: (jsonPath: JSONPath) => void,
    onDiagnosticsCreated?: (diagnostics: readonly JSONPathDiagnostics[]) => void,
    onGetResultAvailable?: (getResult: () => Promise<{ nodes: readonly JSONPathJSONValue[], paths: readonly (string | number)[][] }>) => void
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
            editorViewRef.current.dispatch({ effects: updateQueryArgumentSchemaEffect.of(queryArgumentSchema) });
    }, [queryArgumentSchema]);

    useEffect(() => {
        if (editorViewRef.current !== null)
            editorViewRef.current.dispatch({ effects: setHighlightedRangeEffect.of(highlightedRange) });
    }, [highlightedRange]);

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
        ];
    };

    const onEditorViewCreated = (view: EditorView) => {
        view.dispatch({ effects: [
            updateOptionsEffect.of(options), 
            updateQueryArgumentEffect.of(queryArgument), 
            updateQueryArgumentSchemaEffect.of(queryArgumentSchema), 
            setHighlightedRangeEffect.of(highlightedRange)
        ] });
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
            style={{ maxHeight: "150px" }} />
    );
}
