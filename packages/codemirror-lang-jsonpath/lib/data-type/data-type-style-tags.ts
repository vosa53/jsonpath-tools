import { styleTags, tags as t } from "@lezer/highlight";

/**
 * Style tags for JSONPath data type text representation.
 * 
 * Maps syntax tree node names to tags for syntax highlighting. 
 */
export const jsonPathDataTypeStyleTags = styleTags({
    StringLiteral: t.string,
    NumberLiteral: t.number,
    BooleanLiteral: t.bool,
	Primitive: t.typeName,
	PropertyName: t.propertyName,
	"[ ]": t.squareBracket,
    "{ }": t.brace,
    "...": t.controlOperator,
    "?": t.logicOperator,
    "|": t.logicOperator
});