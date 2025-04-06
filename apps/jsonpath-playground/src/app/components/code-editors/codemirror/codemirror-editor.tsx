import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import { crosshairCursor, drawSelection, dropCursor, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, rectangularSelection } from "@codemirror/view";
import { useComputedColorScheme } from "@mantine/core";
import { EditorView } from "codemirror";
import { CSSProperties, FocusEventHandler, useEffect, useRef } from "react";
import { applicationHighlightStyle } from "./application-highlight-style";
import { applicationKeymap } from "./application-keymap";
import { applicationThemeCommon, applicationThemeDark, applicationThemeLight } from "./application-theme";

/**
 * CodeMirror code editor component.
 */
export default function CodeMirrorEditor({
    value,
    readonly = false,
    style,
    onValueChanged,
    onExtensionsRequested,
    onEditorViewCreated,
    onFocus,
    onBlur
}: {
    value: string,
    readonly?: boolean,
    style?: CSSProperties,
    onValueChanged: (value: string) => void,
    onExtensionsRequested: () => Extension[],
    onEditorViewCreated?: (view: EditorView) => void,
    onFocus?: FocusEventHandler<HTMLElement>,
    onBlur?: FocusEventHandler<HTMLElement>
}) {
    const containerElementRef = useRef<HTMLDivElement>(null);
    const valueInEditorRef = useRef("");
    const editorViewRef = useRef<EditorView>(null);
    const colorScheme = useComputedColorScheme();

    useEffect(() => {
        if (editorViewRef.current !== null) {
            editorViewRef.current.dispatch({
                effects: themeCompartment.reconfigure(colorSchemeToTheme(colorScheme))
            });
        }
    }, [colorScheme]);

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
                    ...applicationKeymap
                ]),
                indentUnit.of("    "),
                applicationThemeCommon,
                themeCompartment.of(colorSchemeToTheme(colorScheme)),
                syntaxHighlighting(applicationHighlightStyle),
                readonlyCompartment.of(EditorState.readOnly.of(readonly)),
                EditorView.updateListener.of(u => {
                    if (u.docChanged) {
                        const newValue = /*logPerformance("editor doc.toString", () => */u.state.doc.toString()/*)*/;
                        //console.log("FROM EDITOR:",newValue);
                        const isFromParent = valueInEditorRef.current === newValue;
                        valueInEditorRef.current = newValue;
                        if (!isFromParent)
                            onValueChanged(newValue);
                    }
                }),
                ...onExtensionsRequested()
            ],
            parent: containerElementRef.current!
        });
        valueInEditorRef.current = value;
        editorViewRef.current = editorView;
        onEditorViewCreated?.(editorView);

        return () => {
            editorView.destroy();
        };
    }, []);

    //useEffect(() => {
    if (editorViewRef.current !== null && value !== valueInEditorRef.current) {
        //console.log("FROM PARENT:",value, valueInEditorRef.current);
        //logPerformance("editor set value", () => {
        queueMicrotask(() => {
            valueInEditorRef.current = value;
            editorViewRef.current!.dispatch({
                changes: { from: 0, to: editorViewRef.current!.state.doc.length, insert: value },
            });
        });
        //});
    }
    //}, [value]);

    return (
        <div ref={containerElementRef} style={style} onFocus={onFocus} onBlur={onBlur}></div>
    );
}

const themeCompartment = new Compartment();
const readonlyCompartment = new Compartment();

function colorSchemeToTheme(colorScheme: "light" | "dark"): Extension {
    return colorScheme === "dark" ? applicationThemeDark : applicationThemeLight;
}
