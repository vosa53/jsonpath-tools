import { basicSetup, EditorView } from "codemirror";
import { Extension } from "@codemirror/state";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { tabKeymap } from "./tab-keymap";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";

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

export default function CodeMirrorEditor({ value, style, onValueChanged: onValueChanged, onExtensionsRequested }:
    { value: string, style?: CSSProperties, onValueChanged: (value: string) => void, onExtensionsRequested: () => Extension[] }) {
    const containerElementRef = useRef<HTMLDivElement>(null);
    const [valueInEditor, setValueInEditor] = useState("");
    const [editorView, setEditorView] = useState<EditorView>();

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
                    "& .cm-tooltip.cm-tooltip-autocomplete > ul > li": { padding: "5px 10px" },
                    "& .cm-completionMatchedText": { textDecoration: "none", color: "var(--mantine-primary-color-filled)" },
                    "& .cm-activeLine": { backgroundColor: "transparent", outline: "2px solid var(--mantine-color-default-hover)" },
                    "& .cm-gutters": { backgroundColor: "transparent", borderRight: "none", padding: "0 5px 0 5px" },
                    "& .cm-lineNumbers .cm-gutterElement": { color: "var(--mantine-color-dimmed)" },
                    "& .cm-lineNumbers .cm-gutterElement.cm-activeLineGutter": { color: "var(--mantine-color-text)" },
                    "& .cm-gutterElement.cm-activeLineGutter": { backgroundColor: "transparent" },
                    "& .cm-line": { padding: "0 2px 0 0" },
                    "& .cm-lintRange-error": { backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">%3Cpath%20d%3D%22m0%202.5%20l2%20-1.5%20l1%200%20l2%201.5%20l1%200%22%20stroke%3D%22%23fa5252%22%20fill%3D%22none%22%20stroke-width%3D%222%22%2F%3E</svg>')` },
                }),
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