export class CharacterCategorizer {
    static isHighSurrogate(character: string) {
        return character >= "\uD800" && character <= "\uDBFF";
    }

    static isLowSurrogate(character: string) {
        return character >= "\uDC00" && character <= "\uDFFF";
    }

    static isBlank(character: string | null) {
        return character === " " || character === "\t" || character === "\n" || character === "\r";
    }

    static isDigit(character: string | null) {
        return character !== null && character >= "0" && character <= "9";
    }

    static isAlpha(character: string | null) {
        return character !== null && (character >= "a" && character <= "z" || character >= "A" && character <= "Z");
    }

    static isLowercaseAlpha(character: string | null) {
        return character !== null && (character >= "a" && character <= "z");
    }

    static isNameFirst(character: string | null) {
        return this.isAlpha(character) || character === "_" || character !== null && character >= "\u0080"; // Non-ASCII characters.
    }

    static isName(character: string | null) {
        return this.isNameFirst(character) || this.isDigit(character);
    }

    static isFunctionNameFirst(character: string | null) {
        return this.isLowercaseAlpha(character);
    }

    static isFunctionName(character: string | null) {
        return this.isFunctionNameFirst(character) || character === "_" || this.isDigit(character);
    }

    static isString(character: string | null) {
        return character !== null && character !== "\\" && character >= "\u0020";
    }
}
