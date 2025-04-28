import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * JSONPath editor highlight style.
 */
export const jsonpathEditorHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "var(--jpei-code-keyword)" },
    { tag: t.bool, color: "var(--jpei-code-keyword)" },
    { tag: t.null, color: "var(--jpei-code-keyword)" },

    { tag: t.operator, color: "var(--jpei-code-operator)" },
    { tag: t.compareOperator, color: "var(--jpei-code-operator)" },
    { tag: t.logicOperator, color: "var(--jpei-code-operator)" },
    { tag: t.controlOperator, color: "var(--jpei-code-operator-control)" },

    { tag: t.typeName, color: "var(--jpei-code-type)" },
    { tag: t.propertyName, color: "var(--jpei-code-name)" },
    { tag: t.variableName, color: "var(--jpei-code-identifier)" },
    { tag: t.function(t.variableName), color: "var(--jpei-code-function)" },

    { tag: t.string, color: "var(--jpei-code-string)" },
    { tag: t.number, color: "var(--jpei-code-number)" },

    { tag: t.brace, color: "var(--jpei-code-brace)" },
    { tag: t.squareBracket, color: "var(--jpei-code-bracket)" },
    { tag: t.paren, color: "var(--jpei-code-parenthesis)" }
]);