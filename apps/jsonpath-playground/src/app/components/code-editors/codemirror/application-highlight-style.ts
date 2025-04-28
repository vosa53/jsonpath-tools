import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * Application CodeMirror highlight style.
 */
export const applicationHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "var(--mantine-color-blue-text)" },
    { tag: t.bool, color: "var(--mantine-color-blue-text)" },
    { tag: t.null, color: "var(--mantine-color-blue-text)" },
    { tag: t.operator, color: "var(--mantine-color-cyan-text)" },
    { tag: t.compareOperator, color: "var(--mantine-color-cyan-text)" },
    { tag: t.logicOperator, color: "var(--mantine-color-cyan-text)" },
    { tag: t.variableName, color: "var(--mantine-color-pink-text)" },
    { tag: t.number, color: "var(--mantine-color-teal-text)" },
    { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--mantine-color-yellow-text)" },
    { tag: t.string, color: "var(--mantine-color-orange-text)" },
    { tag: t.propertyName, color: "var(--mantine-color-indigo-text)" },
    { tag: t.squareBracket, color: "var(--mantine-color-grape-text)" },
    { tag: t.paren, color: "var(--mantine-color-grape-text)" },
    { tag: t.brace, color: "var(--mantine-color-yellow-text)" },
    { tag: t.controlOperator, color: "var(--mantine-color-violet-text)" },
    { tag: t.meta, color: "var(--mantine-color-indigo-text)" },
    { tag: t.link, textDecoration: "underline" },
    { tag: t.heading, textDecoration: "underline", fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.strikethrough, textDecoration: "line-through" },
    { tag: [t.atom, t.url, t.contentSeparator, t.labelName], color: "var(--mantine-color-blue-text)" },
    //{ tag: [t.literal, t.inserted], color: "#164" },
    //{ tag: [t.deleted], color: "#a11" },
    { tag: [t.regexp, t.escape, t.special(t.string)], color: "var(--mantine-color-pink-text)" },
    { tag: t.definition(t.variableName), color: "var(--mantine-color-yellow-text)" },
    //{ tag: t.local(t.variableName), color: "#30a" },
    { tag: [t.className, t.typeName, t.namespace], color: "var(--mantine-color-green-text)" },
    //{ tag: [t.special(t.variableName), t.macroName], color: "#256" },
    { tag: t.definition(t.propertyName), color: "var(--mantine-color-yellow-text)" },
    { tag: t.comment, color: "var(--mantine-color-green-text)" },
    { tag: t.invalid, color: "var(--mantine-color-red-text)" }
]);
