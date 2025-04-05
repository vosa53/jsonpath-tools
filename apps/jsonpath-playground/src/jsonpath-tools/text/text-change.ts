import { TextRange } from "./text-range";

/**
 * Represents a change of a text.
 */
export class TextChange {
    constructor(
        /**
         * Range of the text that is removed.
         */
        readonly range: TextRange,

        /**
         * A text that is inserted in place of {@link range}.
         */
        readonly newText: string
    ) { }
}