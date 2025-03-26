import { JSONPathQueryContext, PushOnlyArray } from "./evaluation";
import { LocatedNode } from "./located-node";
import { JSONPathNode } from "./node";
import { JSONPathSelector } from "./selectors/selector";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";
import { JSONPathToken } from "./token";


export class JSONPathSegment extends JSONPathNode {
    constructor(
        readonly dotToken: JSONPathToken | null,
        readonly openingBracketToken: JSONPathToken | null,
        readonly selectors: readonly { selector: JSONPathSelector; commaToken: JSONPathToken | null; }[],
        readonly closingBracketToken: JSONPathToken | null,

        readonly isDescendant: boolean
    ) {
        super([dotToken, openingBracketToken, ...selectors.flatMap(s => [s.selector, s.commaToken]), closingBracketToken]);
    }

    get type() { return JSONPathSyntaxTreeType.segment; }

    get usesBracketNotation(): boolean {
        return this.openingBracketToken !== null || this.closingBracketToken !== null;
    }

    select(input: LocatedNode, output: PushOnlyArray<LocatedNode>, queryContext: JSONPathQueryContext) {
        const outputStartIndex = output.length;

        for (const selector of this.selectors) {
            const selectorOutputStartIndex = output.length;
            selector.selector.select(input, output, queryContext);
            queryContext.selectorInstrumentationCallback?.(selector.selector, input, output, selectorOutputStartIndex, output.length - selectorOutputStartIndex);
        }

        if (this.isDescendant) {
            if (Array.isArray(input.value)) {
                for (let i = 0; i < input.value.length; i++)
                    this.select(new LocatedNode(input.value[i], i, input), output, queryContext);
            }
            else if (typeof input.value === "object" && input.value !== null) {
                for (const entry of Object.entries(input.value))
                    this.select(new LocatedNode(entry[1], entry[0], input), output, queryContext);
            }
        }

        queryContext.segmentInstrumentationCallback?.(this, input, output, outputStartIndex, output.length - outputStartIndex);
    }
}
