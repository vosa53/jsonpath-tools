import { TextPosition } from "../src/jsonpath-tools/text-range";
import { TokenType } from "./token-type";

export class Token {
    constructor(
        readonly type: TokenType,
        readonly text: string,
        readonly position: TextPosition
    ) { }
}