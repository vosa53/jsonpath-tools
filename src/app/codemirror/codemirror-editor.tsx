import { basicSetup, EditorView } from "codemirror";
import { Extension } from "@codemirror/state";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const highlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "#1877b5" },
    { tag: t.operator, color: "#2c3e50" },
    { tag: t.comment, color: "#16a085" },
    { tag: t.number, color: "#2ecc71" },
    { tag: t.className, color: "#e1b12c" },
    { tag: t.string, color: "#d35400" },
    { tag: t.propertyName, color: "#4fa3db" },
    { tag: t.bracket, color: "#be2edd" }
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
                syntaxHighlighting(highlightStyle),
                indentUnit.of("    "),
                EditorView.theme({
                    "&": { background: "white", height: "100%" },
                    "&.cm-focused": { outline: "none" },
                    "& .cm-content": { fontFamily: "Cascadia Mono", padding: "10px 0" },
                    "& .cm-tooltip": { fontFamily: "Segoe UI" }
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