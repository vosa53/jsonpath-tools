import { QueryContext } from "../evaluation";
import { PushOnlyArray } from "../../helpers/array";
import { Node } from "../../values/node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";

/**
 * Slice selector.
 */
export class SliceSelector extends Selector {
    constructor(
        /**
         * Range start index token. 
         */
        readonly startToken: SyntaxTreeToken | null,
        
        /**
         * Colon token delimiting start and end tokens. 
         */
        readonly firstColonToken: SyntaxTreeToken,

        /**
         * Range end index token. 
         */
        readonly endToken: SyntaxTreeToken | null,

        /**
         * Colon token delimiting end and step tokens.
         */
        readonly secondColonToken: SyntaxTreeToken | null,

        /**
         * Range step token.
         */
        readonly stepToken: SyntaxTreeToken | null,

        /**
         * Range start index (inclusive).
         */
        readonly start: number | null,

        /**
         * Range end index (exclusive).
         */
        readonly end: number | null,

        /**
         * Range step.
         */
        readonly step: number | null
    ) {
        super([startToken, firstColonToken, endToken, secondColonToken, stepToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.sliceSelector; }

    /**
     * @inheritdoc
     */
    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        const isArray = Array.isArray(input.value);
        if (!isArray)
            return;
        if (this.step === 0)
            return;

        const step = this.step ?? 1;
        let start = this.start ?? (step > 0 ? 0 : input.value.length - 1);
        let end = this.end ?? (step > 0 ? input.value.length : -input.value.length - 1);
        if (start < 0) start = input.value.length + start;
        if (end < 0) end = input.value.length + end;
        const lower = step >= 0 ? Math.min(Math.max(start, 0), input.value.length) : Math.min(Math.max(end, -1), input.value.length - 1);
        const upper = step >= 0 ? Math.min(Math.max(end, 0), input.value.length) : Math.min(Math.max(start, -1), input.value.length - 1);

        if (step > 0) {
            for (let i = lower; i < upper; i += step)
                output.push(new Node(input.value[i], i, input));
        }
        else {
            for (let i = upper; i > lower; i += step)
                output.push(new Node(input.value[i], i, input));
        }
    }
}
