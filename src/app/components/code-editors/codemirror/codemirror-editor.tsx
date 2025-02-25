import { defaultKeymap } from "@codemirror/commands";
import { indentUnit, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { MantineColorScheme, useMantineColorScheme } from "@mantine/core";
import { basicSetup, EditorView } from "codemirror";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { tabKeymap } from "./tab-keymap";
import { highlightStyle } from "./highlight-style";
import { theme } from "./theme";
import { logPerformance } from "@/jsonpath-tools/utils";


export default function CodeMirrorEditor({
    value,
    readonly,
    style,
    onValueChanged: onValueChanged,
    onExtensionsRequested,
    onEditorViewCreated
}: {
    value: string,
    readonly: boolean,
    style?: CSSProperties,
    onValueChanged: (value: string) => void,
    onExtensionsRequested: () => Extension[],
    onEditorViewCreated?: (view: EditorView) => void
}) {
    const containerElementRef = useRef<HTMLDivElement>(null);
    const valueInEditorRef = useRef("");
    const editorViewRef = useRef<EditorView>(null);
    const colorScheme = useMantineColorScheme();

    useEffect(() => {
        if (editorViewRef.current !== null) {
            editorViewRef.current.dispatch({
                effects: themeCompartment.reconfigure(colorSchemeToTheme(colorScheme.colorScheme))
            });
        }
    }, [colorScheme.colorScheme]);

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
                basicSetup,
                keymap.of([...defaultKeymap, ...tabKeymap]),
                indentUnit.of("    "),
                theme,
                themeCompartment.of(colorSchemeToTheme(colorScheme.colorScheme)),
                syntaxHighlighting(highlightStyle),
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
        <div ref={containerElementRef} style={style}></div>
    );
}

const themeCompartment = new Compartment();
const readonlyCompartment = new Compartment();
const lightTheme = EditorView.theme({}, { dark: false });
const darkTheme = EditorView.theme({}, { dark: true });

function colorSchemeToTheme(colorScheme: MantineColorScheme): Extension {
    return colorScheme === "dark" ? darkTheme : lightTheme;
}