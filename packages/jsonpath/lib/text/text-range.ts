/**
 * Represents a contiguous range in a text.
 */
export class TextRange {
    constructor(
        /**
         * Index of a character where the range starts. Inclusive and starts with 0.
         */
        readonly position: number,

        /**
         * Length of the range in number of characters.
         */
        readonly length: number
    ) { }
}