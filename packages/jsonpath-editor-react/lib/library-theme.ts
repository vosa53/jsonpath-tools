import { EditorView } from "codemirror";

export const libraryTheme = EditorView.theme({
    "&": { background: "var(--jpei-font-background)", color: "var(--jpei-font-color)", height: "100%", fontSize: "14px", border: "var(--jpei-border)" },
    "&.cm-focused": { outline: "none" },
    "& .cm-content": { fontFamily: "var(--jpei-font-code)", paddingLeft: "2px", paddingRight: "2px" },

    // Lines.
    "& .cm-activeLine": { backgroundColor: "transparent", outline: "2px solid lightgray" },
    "& .cm-gutters": { fontFamily: "var(--jpei-font-code)", backgroundColor: "white", borderRight: "none", padding: "0 5px 0 5px" },
    "& .cm-lineNumbers .cm-gutterElement": { color: "gray" },
    "& .cm-lineNumbers .cm-gutterElement.cm-activeLineGutter": { color: "var(--jpei-font-color)" },
    "& .cm-gutterElement.cm-activeLineGutter": { backgroundColor: "transparent" },
    "& .cm-line": { padding: "0 2px 0 0" },

    // Selection.
    "& .cm-selectionBackground": { background: "blue" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": { background: "blue" },

    // Matches.
    "& .cm-selectionMatch": { background: "yellow" },
    "& .cm-matchingBracket": { background: "yellow" },
    "&.cm-focused .cm-matchingBracket": { background: "yellow" },

    // Tooltips.
    "& .cm-tooltip": { fontFamily: "var(--jpei-font-text)", backgroundColor: "white", color: "var(--jpei-font-color)", border: "var(--jpei-border)", boxShadow: "0px 6px 29px -6px rgba(133,133,133,0.81)", borderRadius: "5px", padding: "5px" },
    "& .cm-tooltip-section:not(:first-child)": { borderTop: "1px solid black", paddingTop: "5px" },

    // Autocomplete.
    "& .cm-tooltip.cm-tooltip-autocomplete": {},
    "& .cm-tooltip.cm-tooltip-autocomplete > ul": { fontFamily: "var(--jpei-font-code)" },
    "& .cm-tooltip-autocomplete ul li[aria-selected]": { background: "var(--jpei-hover)" },
    "& .cm-tooltip.cm-tooltip-autocomplete > ul > li": { padding: "5px 12px", display: "flex", color: "var(--jpei-font-color)", borderRadius: "5px" },
    "& .cm-tooltip-autocomplete .cm-completionDetail": { marginLeft: "auto", paddingLeft: "50px", fontStyle: "normal", color: "gray" },
    "& .cm-tooltip.cm-completionInfo": { whiteSpace: "unset", padding: "5px" },
    "& .cm-completionMatchedText": { textDecoration: "none", color: "var(--jpei-primary)" },
    "& .cm-completionIcon": { display: "flex", flexDirection: "column", justifyContent: "center", marginRight: "6px", opacity: "0.8" },
    "& .cm-completionIcon::after": { width: "20px", height: "20px", display: "block" },

    // Diagnostics.
    "& .cm-diagnostic": { padding: "0" },
    "& .cm-diagnostic-warning": { borderLeft: "none", color: "yellow" },
    "& .cm-diagnostic-error": { borderLeft: "none", color: "red" },
    "& .cm-lintRange-error": { backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">%3Cpath%20d%3D%22m0%202.5%20l2%20-1.5%20l1%200%20l2%201.5%20l1%200%22%20stroke%3D%22%23fa5252%22%20fill%3D%22none%22%20stroke-width%3D%222%22%2F%3E</svg>')` },
    "& .cm-lintRange-warning": { backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">%3Cpath%20d%3D%22m0%202.5%20l2%20-1.5%20l1%200%20l2%201.5%20l1%200%22%20stroke%3D%22%23fab005%22%20fill%3D%22none%22%20stroke-width%3D%222%22%2F%3E</svg>')` },

    // Signature help.
    "& .cmjp-tooltip-signatureHelp": {},
    "& .cmjp-tooltip-signatureHelp-signature": { fontFamily: "var(--jpei-font-code)" },
    "& .cmjp-activeParameter": { textDecoration: "none", color: "var(--jpei-primary)", fontWeight: "500" },

    // Tooltips.
    "& .cmjp-tooltip-range": { background: "orange" },

    // Document highlights.
    "& .cmjp-document-highlight": { background: "yellow" },
});