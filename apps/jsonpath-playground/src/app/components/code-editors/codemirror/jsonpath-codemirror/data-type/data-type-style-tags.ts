import { styleTags, tags as t } from "@lezer/highlight";

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