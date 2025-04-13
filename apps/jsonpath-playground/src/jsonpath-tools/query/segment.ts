import { QueryContext } from "./evaluation";
import { PushOnlyArray } from "../helpers/array";
import { Node } from "../values/node";
import { SyntaxTreeNode } from "./syntax-tree-node";
import { Selector } from "./selectors/selector";
import { SyntaxTreeType } from "./syntax-tree-type";
import { SyntaxTreeToken } from "./syntax-tree-token";

/**
 * Query segment.
 */
export class Segment extends SyntaxTreeNode {
    constructor(
        /**
         * Dot or double dot token, or `null` if not present.
         */
        readonly dotToken: SyntaxTreeToken | null,

        /**
         * Opening bracket token, or `null` if not present.
         */
        readonly openingBracketToken: SyntaxTreeToken | null,

        /**
         * Selectors
         */
        readonly selectors: readonly { selector: Selector; commaToken: SyntaxTreeToken | null; }[],
        
        /**
         * Closing bracket token, or `null` if not present.
         */
        readonly closingBracketToken: SyntaxTreeToken | null,

        /**
         * Whether it is a child segment or a descendant segment.
         */
        readonly segmentType: SegmentType
    ) {
        super([dotToken, openingBracketToken, ...selectors.flatMap(s => [s.selector, s.commaToken]), closingBracketToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.segment; }

    /**
     * Whether the segment uses a bracket notation.
     */
    get usesBracketNotation(): boolean {
        return this.openingBracketToken !== null || this.closingBracketToken !== null;
    }

    /**
     * Selects nodes from the input node to the output array.
     * @param input Input node.
     * @param output Output nodes.
     * @param queryContext Query context.
     */
    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext) {
        const outputStartIndex = output.length;

        for (const selector of this.selectors) {
            const selectorOutputStartIndex = output.length;
            selector.selector.select(input, output, queryContext);
            queryContext.selectorInstrumentationCallback?.(selector.selector, input, output, selectorOutputStartIndex, output.length - selectorOutputStartIndex);
        }

        if (this.segmentType === SegmentType.descendant) {
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

/**
 * Type of a segment.
 */
export enum SegmentType {
    /**
     * Child segment.
     */
    child,

    /**
     * Descendant segment.
     */
    descendant
}