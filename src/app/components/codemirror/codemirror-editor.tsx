import { defaultKeymap } from "@codemirror/commands";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { basicSetup, EditorView } from "codemirror";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { tabKeymap } from "./tab-keymap";
import { MantineColorScheme, useMantineColorScheme } from "@mantine/core";

const highlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "var(--mantine-color-blue-text)" },
    { tag: t.operator, color: "var(--mantine-color-cyan-text)" },
    { tag: t.comment, color: "var(--mantine-color-pink-text)" },
    { tag: t.number, color: "var(--mantine-color-teal-text)" },
    { tag: t.className, color: "var(--mantine-color-yellow-text)" },
    { tag: t.string, color: "var(--mantine-color-orange-text)" },
    { tag: t.propertyName, color: "var(--mantine-color-indigo-text)" },
    { tag: t.bracket, color: "var(--mantine-color-grape-text)" },
    { tag: t.annotation, color: "var(--mantine-color-violet-text)" }
]);

const themeCompartment = new Compartment();
const readonlyCompartment = new Compartment();
const lightTheme = EditorView.theme({}, { dark: false });
const darkTheme = EditorView.theme({}, { dark: true });

function colorSchemeToTheme(colorScheme: MantineColorScheme): Extension {
    return colorScheme === "dark" ? darkTheme : lightTheme;
}

export default function CodeMirrorEditor({ value, readonly, style, onValueChanged: onValueChanged, onExtensionsRequested }:
    { value: string, readonly: boolean, style?: CSSProperties, onValueChanged: (value: string) => void, onExtensionsRequested: () => Extension[] }) {
    const containerElementRef = useRef<HTMLDivElement>(null);
    const [valueInEditor, setValueInEditor] = useState("");
    const [editorView, setEditorView] = useState<EditorView>();
    const colorScheme = useMantineColorScheme();

    useEffect(() => {
        if (editorView !== undefined) {
            editorView.dispatch({
                effects: themeCompartment.reconfigure(colorSchemeToTheme(colorScheme.colorScheme))
            });
        }
    }, [colorScheme.colorScheme]);

    useEffect(() => {
        if (editorView !== undefined) {
            editorView.dispatch({
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
                syntaxHighlighting(highlightStyle),
                indentUnit.of("    "),
                EditorView.theme({
                    "&": { background: "var(--mantine-color-body)", color: "var(--mantine-color-text)", height: "100%", fontSize: "14px" },
                    "&.cm-focused": { outline: "none" },
                    "& .cm-content": { fontFamily: "var(--mantine-font-family-monospace)" },
                    "& .cm-tooltip": { fontFamily: "var(--mantine-font-family)", backgroundColor: "var(--mantine-color-body)", border: "1px solid var(--app-shell-border-color)", boxShadow: "var(--mantine-shadow-xl)" },
                    "& .cm-tooltip.cm-tooltip-autocomplete > ul": { fontFamily: "var(--mantine-font-family-monospace)" },
                    "& .cm-tooltip-autocomplete ul li[aria-selected]": { background: "var(--mantine-color-default-hover)", color: "var(--mantine-color-text)" },
                    "& .cm-tooltip.cm-tooltip-autocomplete > ul > li": { padding: "5px 10px", display: "flex" },
                    "& .cm-tooltip-autocomplete .cm-completionDetail": { marginLeft: "auto", fontStyle: "normal", color: "var(--mantine-color-dimmed)" },
                    "& .cm-completionMatchedText": { textDecoration: "none", color: "var(--mantine-primary-color-filled)" },
                    "& .cm-activeLine": { backgroundColor: "transparent", outline: "2px solid var(--mantine-color-default-hover)" },
                    "& .cm-gutters": { backgroundColor: "transparent", borderRight: "none", padding: "0 5px 0 5px" },
                    "& .cm-lineNumbers .cm-gutterElement": { color: "var(--mantine-color-dimmed)" },
                    "& .cm-lineNumbers .cm-gutterElement.cm-activeLineGutter": { color: "var(--mantine-color-text)" },
                    "& .cm-gutterElement.cm-activeLineGutter": { backgroundColor: "transparent" },
                    "& .cm-line": { padding: "0 2px 0 0" },
                    "& .cm-lintRange-error": { backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">%3Cpath%20d%3D%22m0%202.5%20l2%20-1.5%20l1%200%20l2%201.5%20l1%200%22%20stroke%3D%22%23fa5252%22%20fill%3D%22none%22%20stroke-width%3D%222%22%2F%3E</svg>')` },
                    //"& .cm-completionIcon": { color: "white", /*paddingRight: 0, marginRight: "0.6em", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center", width: "1em"*/ },
                    /*"& .cm-completionIcon-property::after": { content: `url('data:image/svg+xml,<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-label"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16.52 7h-10.52a2 2 0 0 0 -2 2v6a2 2 0 0 0 2 2h10.52a1 1 0 0 0 .78 -.375l3.7 -4.625l-3.7 -4.625a1 1 0 0 0 -.78 -.375" /></svg>')` },
                    "& .cm-completionIcon-keyword::after": { content: `url('data:image/svg+xml,<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-blocks"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 4a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1z" /><path d="M3 14h12a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h3a2 2 0 0 1 2 2v12" /></svg>')` },
                    "& .cm-completionIcon-function::after": { content: `url('data:image/svg+xml,<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-math-function"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 19a2 2 0 0 0 2 2c2 0 2 -4 3 -9s1 -9 3 -9a2 2 0 0 1 2 2" /><path d="M5 12h6" /><path d="M15 12l6 6" /><path d="M15 18l6 -6" /></svg>')` },
                    "& .cm-completionIcon-constant::after": { content: `url('data:image/svg+xml,<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-library"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 3m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 7.26a2.005 2.005 0 0 0 -1.012 1.737v10c0 1.1 .9 2 2 2h10c.75 0 1.158 -.385 1.5 -1" /><path d="M11 7h5" /><path d="M11 10h6" /><path d="M11 13h3" /></svg>')` },*/
                }),
                themeCompartment.of(colorSchemeToTheme(colorScheme.colorScheme)),
                readonlyCompartment.of(EditorState.readOnly.of(readonly)),
                EditorView.updateListener.of(u => {
                    if (u.docChanged) {
                        const newValue = u.state.doc.toString();
                        setValueInEditor(newValue);
                        onValueChanged(newValue);
                    }
                }),
                ...onExtensionsRequested()
            ],
            parent: containerElementRef.current!
        });
        setValueInEditor(value);
        setEditorView(editorView);
    }, []);

    useEffect(() => {
        if (editorView !== undefined && value !== valueInEditor) {
            setValueInEditor(value);
            editorView.dispatch({
                changes: { from: 0, to: editorView.state.doc.length, insert: value },
            });
        }
    }, [value]);

    return (
        <div ref={containerElementRef} style={style}></div>
    );
}