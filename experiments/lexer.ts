import { TextPosition } from "../src/jsonpath-tools/text-range";
import { Token } from "./token";
import { TokenType } from "./token-type";

export class Lexer {
    private static readonly _tokenDefinitions: TokenDefinition[] = [
        { regex: /\./, type: TokenType.dot },
        { regex: /\.\./, type: TokenType.doubleDot },
        { regex: /:/, type: TokenType.colon },
        { regex: /,/, type: TokenType.comma },
        { regex: /\$/, type: TokenType.rootIdentifier },
        { regex: /@/, type: TokenType.currentNodeIdentifier },
        { regex: /\*/, type: TokenType.wildcardSelector },
        { regex: /\?/, type: TokenType.filterSelector },
        { regex: /&&/, type: TokenType.and },
        { regex: /\|\|/, type: TokenType.or },
        { regex: /!/, type: TokenType.not },
        { regex: /\(/, type: TokenType.openParanthesis },
        { regex: /\)/, type: TokenType.closeParanthesis },
        { regex: /\[/, type: TokenType.openBracket },
        { regex: /\]/, type: TokenType.closeBracket },
        { regex: /==/, type: TokenType.equals },
        { regex: /!=/, type: TokenType.notEquals },
        { regex: /</, type: TokenType.lower },
        { regex: />/, type: TokenType.greater },
        { regex: /<=/, type: TokenType.lowerOrEquals },
        { regex: />=/, type: TokenType.greaterOrEquals },
        { regex: /true/, type: TokenType.trueKeyword },
        { regex: /false/, type: TokenType.falseKeyword },
        { regex: /null/, type: TokenType.nullKeyword },
        { regex: /[A-Za-z_][A-Za-z_0-9]*/, type: TokenType.nullKeyword },
        { regex: /^(?:\x20|\x09|\x0A|\x0D)+/, type: TokenType.space }
    ];

    private tokenizeSingle(): Token {

    }

    tokenize(input: string): Token[] {
        const tokens: Token[] = [];
        const position = new LexerPosition();
        const currentSkippedTokens = [];
        while (position.index < input.length) {
            for (const tokenDefinition of Lexer._tokenDefinitions) {
                const tokenMatch = input.substring(position.index).match(tokenDefinition.regex);
                if (tokenMatch?.length === 1)
                {
                    position.advance(tokenMatch[0]);
                    return new Token(tokenDefinition.type, tokenMatch[0], position.textPosition);
                }
            }
        }

        const endOfFileToken = new Token(TokenType.endOfFile, "", position.textPosition);
        tokens.push(endOfFileToken);
        return tokens;
    }

    private tokenizeSingle(input: string, position: LexerPosition): Token {
        let invalidCharacters = "";
        while (position.index < input.length) {
            for (const tokenDefinition of Lexer._tokenDefinitions) {
                const tokenMatch = input.substring(position.index).match(tokenDefinition.regex);
                if (tokenMatch?.length === 1)
                {
                    position.advance(tokenMatch[0]);
                    return new Token(tokenDefinition.type, tokenMatch[0], position.textPosition);
                }
            }
        }

    }

    private shouldSkip(token: TokenType): boolean {

    }
}

class LexerPosition
{
    private _index: number = 0;
    private _line: number = 0;
    private _column: number = 0;

    get index(): number { return this._index; }
    get line(): number { return this._line; }
    get column(): number { return this._column; }
    get textPosition(): TextPosition { return new TextPosition(this._line, this._column); }

    advance(text: string)
    {
        for (var i = 0; i < text.length; i++)
        {
            if (text[i] == '\r' && !(i + 1 < text.length && text[i + 1] == '\n') || text[i] == '\n')
            {
                this._line++;
                this._column = 1;
            }
            else
                this._column++;
        }
        this._index += text.length;
    }
}

interface TokenDefinition {
    regex: RegExp;
    type: TokenType;
}
