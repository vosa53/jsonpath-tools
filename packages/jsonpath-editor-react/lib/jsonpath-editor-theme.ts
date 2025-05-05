import { EditorView } from "@codemirror/view";

/**
 * JSONPath editor theme.
 */
export const jsonpathEditorTheme = EditorView.theme({
    "&": { background: "var(--jpei-background)", color: "var(--jpei-color)", height: "100%", fontSize: "14px", border: "solid 1px var(--jpei-border)", borderRadius: "5px" },
    "&.cm-focused": { outline: "none" },
    "& .cm-content": { fontFamily: "var(--jpei-font-code)", paddingLeft: "2px", paddingRight: "2px" },

    // Lines.
    "& .cm-activeLine": { backgroundColor: "transparent", outline: "2px solid var(--jpei-line-current)" },
    "& .cm-gutters": { fontFamily: "var(--jpei-font-code)", backgroundColor: "var(--jpei-background)", borderRight: "none", borderRadius: "5px", padding: "0 5px 0 5px" },
    "& .cm-lineNumbers .cm-gutterElement": { color: "var(--jpei-dimmed)" },
    "& .cm-lineNumbers .cm-gutterElement.cm-activeLineGutter": { color: "var(--jpei-font-color)" },
    "& .cm-gutterElement.cm-activeLineGutter": { backgroundColor: "transparent" },
    "& .cm-line": { padding: "0 2px 0 0" },

    // Selection.
    "& .cm-selectionBackground": { background: "var(--jpei-selection)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": { background: "var(--jpei-selection)" },

    // Matches.
    "& .cm-selectionMatch": { background: "var(--jpei-highlighted-match)" },
    "& .cm-matchingBracket": { background: "var(--jpei-highlighted-match)" },
    "&.cm-focused .cm-matchingBracket": { background: "var(--jpei-highlighted-match)" },

    // Tooltips.
    "& .cm-tooltip": { fontFamily: "var(--jpei-font-text)", backgroundColor: "var(--jpei-background)", color: "var(--jpei-font-color)", border: "solid 1px var(--jpei-border)", boxShadow: "0px 6px 29px -6px rgba(133,133,133,0.81)", borderRadius: "5px", padding: "10px" },
    "& .cm-tooltip-section:not(:first-child)": { borderTop: "solid 1px var(--jpei-border)", paddingTop: "5px", marginTop: "5px" },

    // Autocomplete.
    "& .cm-tooltip.cm-tooltip-autocomplete": {},
    "& .cm-tooltip.cm-tooltip-autocomplete > ul": { fontFamily: "var(--jpei-font-code)" },
    "& .cm-tooltip-autocomplete ul li[aria-selected]": { background: "var(--jpei-hover)" },
    "& .cm-tooltip.cm-tooltip-autocomplete > ul > li": { padding: "5px 12px", display: "flex", color: "var(--jpei-font-color)", borderRadius: "5px" },
    "& .cm-tooltip-autocomplete .cm-completionDetail": { marginLeft: "auto", paddingLeft: "50px", fontStyle: "normal", color: "var(--jpei-dimmed)" },
    "& .cm-tooltip.cm-completionInfo": { whiteSpace: "unset", padding: "10px" },
    "& .cm-completionMatchedText": { textDecoration: "none", color: "var(--jpei-primary)" },
    "& .cm-completionIcon": { display: "flex", flexDirection: "column", justifyContent: "center", marginRight: "6px", opacity: "0.8" },
    "& .cm-completionIcon::after": { width: "20px", height: "20px", display: "block" },
    // Tabler Icons (https://tabler.io/icons).
    "& .cm-completionIcon-property::after": { content: `url('data:image/svg+xml,<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="%234c6ef5"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-label"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16.52 7h-10.52a2 2 0 0 0 -2 2v6a2 2 0 0 0 2 2h10.52a1 1 0 0 0 .78 -.375l3.7 -4.625l-3.7 -4.625a1 1 0 0 0 -.78 -.375" /></svg>')` },
    "& .cm-completionIcon-keyword::after": { content: `url('data:image/svg+xml,<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="%237950f2"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-blocks"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 4a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1z" /><path d="M3 14h12a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h3a2 2 0 0 1 2 2v12" /></svg>')` },
    "& .cm-completionIcon-function::after": { content: `url('data:image/svg+xml,<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="%23fab005"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-math-function"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 19a2 2 0 0 0 2 2c2 0 2 -4 3 -9s1 -9 3 -9a2 2 0 0 1 2 2" /><path d="M5 12h6" /><path d="M15 12l6 6" /><path d="M15 18l6 -6" /></svg>')` },
    "& .cm-completionIcon-constant::after": { content: `url('data:image/svg+xml,<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="%23fd7e14"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-library"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 3m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 7.26a2.005 2.005 0 0 0 -1.012 1.737v10c0 1.1 .9 2 2 2h10c.75 0 1.158 -.385 1.5 -1" /><path d="M11 7h5" /><path d="M11 10h6" /><path d="M11 13h3" /></svg>')` },

    // Diagnostics.
    "& .cm-diagnostic": { padding: "0" },
    "& .cm-diagnostic-warning": { borderLeft: "none", color: "var(--jpei-diagnostics-warning)" },
    "& .cm-diagnostic-error": { borderLeft: "none", color: "var(--jpei-diagnostics-error)" },
    "& .cm-lintRange-error": { backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">%3Cpath%20d%3D%22m0%202.5%20l2%20-1.5%20l1%200%20l2%201.5%20l1%200%22%20stroke%3D%22%23fa5252%22%20fill%3D%22none%22%20stroke-width%3D%222%22%2F%3E</svg>')` },
    "& .cm-lintRange-warning": { backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">%3Cpath%20d%3D%22m0%202.5%20l2%20-1.5%20l1%200%20l2%201.5%20l1%200%22%20stroke%3D%22%23fab005%22%20fill%3D%22none%22%20stroke-width%3D%222%22%2F%3E</svg>')` },

    // Signature help.
    "& .cmjp-tooltip-signatureHelp": {},
    "& .cmjp-tooltip-signatureHelp-signature": { fontFamily: "var(--jpei-font-code)" },
    "& .cmjp-activeParameter": { textDecoration: "none", color: "var(--jpei-primary)", fontWeight: "500" },

    // Tooltips.
    "& .cmjp-tooltip-range": { background: "var(--jpei-highlighted)" },

    // Document highlights.
    "& .cmjp-document-highlight": { background: "var(--jpei-highlighted-match)" }
});