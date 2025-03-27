import { TextRange } from "./text-range";

export class TextChange {
    constructor(
        readonly range: TextRange,
        readonly newText: string
    ) { }
}