import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export const libraryHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "var(--jpei-code-keyword)" },
    { tag: t.bool, color: "var(--jpei-code-keyword)" },
    { tag: t.null, color: "var(--jpei-code-keyword)" },
    { tag: t.operator, color: "var(--jpei-code-operator)" },
    { tag: t.compareOperator, color: "var(--jpei-code-operator)" },
    { tag: t.logicOperator, color: "var(--jpei-code-operator)" },
    { tag: t.variableName, color: "var(--jpei-code-variable)" },
    { tag: t.number, color: "var(--jpei-code-number)" },
    { tag: t.className, color: "var(--jpei-code-class)" },
    { tag: t.string, color: "var(--jpei-code-string)" },
    { tag: t.propertyName, color: "var(--jpei-code-property)" },
    { tag: t.squareBracket, color: "var(--jpei-code-bracket)" },
    { tag: t.paren, color: "var(--jpei-code-parenthesis)" },
    { tag: t.brace, color: "var(--jpei-code-brace)" },
    { tag: t.controlOperator, color: "var(--jpei-code-operator-control)" },
    { tag: t.typeName, color: "var(--jpei-code-type)" }
]);