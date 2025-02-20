import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";


export const highlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "var(--mantine-color-blue-text)" },
    { tag: t.bool, color: "var(--mantine-color-blue-text)" },
    { tag: t.null, color: "var(--mantine-color-blue-text)" },
    { tag: t.operator, color: "var(--mantine-color-cyan-text)" },
    { tag: t.compareOperator, color: "var(--mantine-color-cyan-text)" },
    { tag: t.logicOperator, color: "var(--mantine-color-cyan-text)" },
    { tag: t.variableName, color: "var(--mantine-color-pink-text)" },
    { tag: t.number, color: "var(--mantine-color-teal-text)" },
    { tag: t.className, color: "var(--mantine-color-yellow-text)" },
    { tag: t.string, color: "var(--mantine-color-orange-text)" },
    { tag: t.propertyName, color: "var(--mantine-color-indigo-text)" },
    { tag: t.bracket, color: "var(--mantine-color-grape-text)" },
    { tag: t.controlOperator, color: "var(--mantine-color-violet-text)" }
]);