import { QueryContext, PushOnlyArray } from "../evaluation";
import { Node } from "../located-node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../token";
import { Selector } from "./selector";


export class SliceSelector extends Selector {
    constructor(
        readonly startToken: SyntaxTreeToken | null,
        readonly firstColonToken: SyntaxTreeToken,
        readonly endToken: SyntaxTreeToken | null,
        readonly secondColonToken: SyntaxTreeToken | null,
        readonly stepToken: SyntaxTreeToken | null,

        readonly start: number | null,
        readonly end: number | null,
        readonly step: number | null
    ) {
        super([startToken, firstColonToken, endToken, secondColonToken, stepToken]);
    }

    get type() { return SyntaxTreeType.sliceSelector; }

    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        const isArray = Array.isArray(input.value);
        if (!isArray)
            return;
        if (this.step === 0)
            return;

        let step = this.step ?? 1;
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
