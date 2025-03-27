import { QueryContext, PushOnlyArray } from "./evaluation";
import { Node } from "./located-node";
import { SyntaxTreeNode } from "./node";
import { Selector } from "./selectors/selector";
import { SyntaxTreeType } from "./syntax-tree-type";
import { SyntaxTreeToken } from "./token";


export class Segment extends SyntaxTreeNode {
    constructor(
        readonly dotToken: SyntaxTreeToken | null,
        readonly openingBracketToken: SyntaxTreeToken | null,
        readonly selectors: readonly { selector: Selector; commaToken: SyntaxTreeToken | null; }[],
        readonly closingBracketToken: SyntaxTreeToken | null,

        readonly isDescendant: boolean
    ) {
        super([dotToken, openingBracketToken, ...selectors.flatMap(s => [s.selector, s.commaToken]), closingBracketToken]);
    }

    get type() { return SyntaxTreeType.segment; }

    get usesBracketNotation(): boolean {
        return this.openingBracketToken !== null || this.closingBracketToken !== null;
    }

    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext) {
        const outputStartIndex = output.length;

        for (const selector of this.selectors) {
            const selectorOutputStartIndex = output.length;
            selector.selector.select(input, output, queryContext);
            queryContext.selectorInstrumentationCallback?.(selector.selector, input, output, selectorOutputStartIndex, output.length - selectorOutputStartIndex);
        }

        if (this.isDescendant) {
            if (Array.isArray(input.value)) {
                for (let i = 0; i < input.value.length; i++)
                    this.select(new Node(input.value[i], i, input), output, queryContext);
            }
            else if (typeof input.value === "object" && input.value !== null) {
                for (const entry of Object.entries(input.value))
                    this.select(new Node(entry[1], entry[0], input), output, queryContext);
            }
        }

        queryContext.segmentInstrumentationCallback?.(this, input, output, outputStartIndex, output.length - outputStartIndex);
    }
}
