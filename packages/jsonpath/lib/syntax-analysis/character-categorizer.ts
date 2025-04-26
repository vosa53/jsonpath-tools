/**
 * Categorizes characters based on the JSONPath grammar.
 */
export class CharacterCategorizer {
    /**
     * Whether the character is a Unicode high surrogate.
     * @param character Character.
     */
    static isHighSurrogate(character: string) {
        return character >= "\uD800" && character <= "\uDBFF";
    }

    /**
     * Whether the character is a Unicode low surrogate.
     * @param character Character.
     */
    static isLowSurrogate(character: string) {
        return character >= "\uDC00" && character <= "\uDFFF";
    }

    /**
     * Whether the character is a blank character.
     * @param character Character.
     */
    static isBlank(character: string | null) {
        return character === " " || character === "\t" || character === "\n" || character === "\r";
    }

    /**
     * Whether the character is a digit.
     * @param character Character.
     */
    static isDigit(character: string | null) {
        return character !== null && character >= "0" && character <= "9";
    }

    /**
     * Whether the character is an ASCII alpha character.
     * @param character Character.
     */
    static isAlpha(character: string | null) {
        return character !== null && (character >= "a" && character <= "z" || character >= "A" && character <= "Z");
    }

    /**
     * Whether the character is a lowercase ASCII alpha character.
     * @param character Character.
     */
    static isLowercaseAlpha(character: string | null) {
        return character !== null && (character >= "a" && character <= "z");
    }

    /**
     * Whether the character is a first character of a name.
     * @param character Character.
     */
    static isNameFirst(character: string | null) {
        return this.isAlpha(character) || character === "_" || character !== null && character >= "\u0080"; // Non-ASCII characters.
    }

    /**
     * Whether the character is a character of a name.
     * @param character Character.
     */
    static isName(character: string | null) {
        return this.isNameFirst(character) || this.isDigit(character);
    }

    /**
     * Whether the character is a first character of a function name.
     * @param character Character.
     */
    static isFunctionNameFirst(character: string | null) {
        return this.isLowercaseAlpha(character);
    }

    /**
     * Whether the character is a character of a function name.
     * @param character Character.
     */
    static isFunctionName(character: string | null) {
        return this.isFunctionNameFirst(character) || character === "_" || this.isDigit(character);
    }

    /**
     * Whether the character is a character in a string.
     * @param character Character.
     */
    static isString(character: string | null) {
        return character !== null && character !== "\\" && character >= "\u0020";
    }
}
