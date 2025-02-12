import { JSONPathJSONValue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathSliceSelector extends JSONPathSelector {
    constructor(
        readonly startToken: JSONPathToken | null,
        readonly firstColonToken: JSONPathToken,
        readonly endToken: JSONPathToken | null,
        readonly secondColonToken: JSONPathToken | null,
        readonly stepToken: JSONPathToken | null,

        readonly start: number | null,
        readonly end: number | null,
        readonly step: number | null
    ) {
        super([startToken, firstColonToken, endToken, secondColonToken, stepToken]);
    }

    get type() { return JSONPathSyntaxTreeType.sliceSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isArray = Array.isArray(input);
        if (!isArray)
            return;
        if (this.step === 0)
            return;

        let step = this.step ?? 1;
        let start = this.start ?? (step > 0 ? 0 : input.length - 1);
        let end = this.end ?? (step > 0 ? input.length : -input.length - 1);
        if (start < 0) start = input.length + start;
        if (end < 0) end = input.length + end;
        const lower = step >= 0 ? Math.min(Math.max(start, 0), input.length) : Math.min(Math.max(end, -1), input.length - 1);
        const upper = step >= 0 ? Math.min(Math.max(end, 0), input.length) : Math.min(Math.max(start, -1), input.length - 1);

        if (step > 0) {
            for (let i = lower; i < upper; i += step)
                output.push(input[i]);
        }
        else {
            for (let i = upper; i > lower; i += step)
                output.push(input[i]);
        }
    }
}
