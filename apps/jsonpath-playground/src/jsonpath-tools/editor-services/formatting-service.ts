import { AndExpression } from "../query/filter-expression/and-expression";
import { ComparisonExpression } from "../query/filter-expression/comparison-expression";
import { FunctionExpression } from "../query/filter-expression/function-expression";
import { NotExpression } from "../query/filter-expression/not-expression";
import { OrExpression } from "../query/filter-expression/or-expression";
import { ParanthesisExpression } from "../query/filter-expression/paranthesis-expression";
import { Query } from "../query/query";
import { SyntaxTreeNode } from "../query/syntax-tree-node";
import { SubQuery } from "../query/sub-query";
import { Segment } from "../query/segment";
import { FilterSelector } from "../query/selectors/filter-selector";
import { SliceSelector } from "../query/selectors/slice-selector";
import { SyntaxTree } from "../query/syntax-tree";
import { TextChange } from "../text/text-change";
import { TextRange } from "../text/text-range";

export class FormattingService {
    getFormattingEdits(query: Query): TextChange[] {
        const context = new FormatterContext();
        this.formatTree(query, 0, context);
        return context.edits;
    }

    private addPolicies(tree: SyntaxTree, context: FormatterContext) {
        if (tree instanceof Query) {
            context.addPolicy(tree.query, WhitespacePolicy.disallowed, false);
            context.addPolicy(tree.endOfFileToken, WhitespacePolicy.disallowed, false);
        }
        if (tree instanceof SubQuery) {
            for (const segment of tree.segments)
                context.addPolicy(segment, WhitespacePolicy.shouldNotBe, true);
        }
        if (tree instanceof Segment) {
            if (tree.dotToken !== null && tree.openingBracketToken !== null)
                context.addPolicy(tree.openingBracketToken, WhitespacePolicy.shouldNotBe, false);
            if (tree.openingBracketToken !== null)
                this.addDelimitedPolicies(tree.selectors, e => e.selector, e => e.commaToken, false, context);
            if (tree.closingBracketToken !== null)
                context.addPolicy(tree.closingBracketToken, WhitespacePolicy.shouldNotBe, false);
        }
        if (tree instanceof FilterSelector)
            context.addPolicy(tree.expression, WhitespacePolicy.shouldNotBe, true);
        if (tree instanceof SliceSelector) {
            if (tree.startToken !== null)
                context.addPolicy(tree.firstColonToken, WhitespacePolicy.shouldNotBe, true);
            if (tree.endToken !== null)
                context.addPolicy(tree.endToken, WhitespacePolicy.shouldNotBe, true);
            if (tree.secondColonToken !== null)
                context.addPolicy(tree.secondColonToken, WhitespacePolicy.shouldNotBe, true);
            if (tree.stepToken !== null)
                context.addPolicy(tree.stepToken, WhitespacePolicy.shouldNotBe, true);
        }
        if (tree instanceof ComparisonExpression) {
            context.addPolicy(tree.operatorToken, WhitespacePolicy.shouldBe, true);
            context.addPolicy(tree.right, WhitespacePolicy.shouldBe, true);
        }
        if (tree instanceof AndExpression)
            this.addDelimitedPolicies(tree.expressions, e => e.expression, e => e.andToken, true, context);
        if (tree instanceof OrExpression)
            this.addDelimitedPolicies(tree.expressions, e => e.expression, e => e.orToken, true, context);
        if (tree instanceof NotExpression)
            context.addPolicy(tree.expression, WhitespacePolicy.shouldNotBe, true);
        if (tree instanceof ParanthesisExpression) {
            context.addPolicy(tree.expression, WhitespacePolicy.shouldNotBe, true);
            context.addPolicy(tree.closingParanthesisToken, WhitespacePolicy.shouldNotBe, false);
        }
        if (tree instanceof FunctionExpression) {
            context.addPolicy(tree.openingParanthesisToken, WhitespacePolicy.shouldNotBe, false);
            this.addDelimitedPolicies(tree.args, e => e.arg, e => e.commaToken, false, context);
            context.addPolicy(tree.closingParanthesisToken, WhitespacePolicy.shouldNotBe, false);
        }
    }

    private addDelimitedPolicies<TElement>(
        list: readonly TElement[],
        getElement: (element: TElement) => SyntaxTree,
        getDelimiter: (element: TElement) => SyntaxTree | null,
        allowWhitespaceBeforeDelimiter: boolean,
        context: FormatterContext
    ) {
        for (let i = 0; i < list.length; i++) {
            const element = list[i];
            context.addPolicy(getElement(element), i === 0 ? WhitespacePolicy.shouldNotBe : WhitespacePolicy.shouldBe, true);
            const delimiter = getDelimiter(element);
            if (delimiter !== null)
                context.addPolicy(delimiter, allowWhitespaceBeforeDelimiter ? WhitespacePolicy.shouldBe : WhitespacePolicy.shouldNotBe, true);
        }
    }


    private formatTree(tree: SyntaxTree, baseIndent: number, context: FormatterContext) {
        if (tree instanceof SyntaxTreeNode) {
            this.addPolicies(tree, context);
            for (let i = 0; i < tree.children.length; i++) {
                const child = tree.children[i];
                let wasIndent = false;
                if (i !== 0) {
                    const whitespacePolicy = context.getWhitespacePolicy(child);
                    wasIndent = this.addEdit(child, baseIndent, whitespacePolicy, context);
                }
                this.formatTree(child, wasIndent ? baseIndent + 1 : baseIndent, context);
            }
        }
    }

    private addEdit(tree: SyntaxTree, baseIndent: number, whitespacePolicy: WhitespacePolicy, context: FormatterContext) {
        const lines = this.getSkippedTextLines(tree);
        if (whitespacePolicy === WhitespacePolicy.disallowed) {
            this.adjustSpaces(tree.skippedTextBefore, tree.position, 0, tree.skippedTextBefore.length, "", 0, context);
            return false
        }
        else if (whitespacePolicy === WhitespacePolicy.shouldNotBe) {
            this.adjustSpaces(tree.skippedTextBefore, tree.position, 0, lines[0].length, "", 0, context);
            const indentationPolicy = context.getIndentPolicy(tree);
            const indentationLevel = indentationPolicy ? baseIndent + 1 : baseIndent;
            for (let i = 1; i < lines.length; i++)
                this.adjustSpaces(tree.skippedTextBefore, tree.position, lines[i].textOffset, lines[i].length, " ", indentationLevel * 4, context);
            return lines.length > 1;
        }
        else {
            if (lines.length === 1)
                this.adjustSpaces(tree.skippedTextBefore, tree.position, 0, lines[0].length, " ", 1, context);
            else {
                this.adjustSpaces(tree.skippedTextBefore, tree.position, 0, lines[0].length, "", 0, context);
                const indentationPolicy = context.getIndentPolicy(tree);
                const indentationLevel = indentationPolicy ? baseIndent + 1 : baseIndent;
                for (let i = 1; i < lines.length; i++)
                    this.adjustSpaces(tree.skippedTextBefore, tree.position, lines[i].textOffset, lines[i].length, " ", indentationLevel * 4, context);
            }
            return lines.length > 1;
        }
    }

    private getSkippedTextLines(tree: SyntaxTree): SkippedTextLine[] {
        const lines: SkippedTextLine[] = [];
        let lineStart = 0;
        for (let i = 0; i < tree.skippedTextBefore.length; i++) {
            if (tree.skippedTextBefore[i] === "\r" || tree.skippedTextBefore[i] === "\n") {
                lines.push({ textOffset: lineStart, length: i - lineStart });
                if (i + 1 < tree.skippedTextBefore.length && tree.skippedTextBefore[i + 1] == "\r" && tree.skippedTextBefore[i + 1] == "\n")
                    i++;
                lineStart = i + 1;
            }
        }
        lines.push({ textOffset: lineStart, length: tree.skippedTextBefore.length - lineStart });
        return lines;
    }

    private adjustSpaces(text: string, textPosition: number, textOffset: number, textLength: number, character: string, count: number, context: FormatterContext) {
        let whitespaceCount = 0;
        let onlyCorrectCharacters = true;
        for (let i = textOffset; i < textOffset + textLength; i++) {
            if (text[i] === " " || text[i] === "\r" || text[i] === "\n") whitespaceCount++; // TODO: More whitespace characters.
            else break;
            if (text[i] !== character) onlyCorrectCharacters = false;
        }
        if (whitespaceCount === count && onlyCorrectCharacters) return;
        context.addEdit(new TextChange(new TextRange(textPosition + textOffset, whitespaceCount), character.repeat(count)));

    }
}

class FormatterContext {
    private _edits: TextChange[] = [];
    whitespacePolicies = new Map<SyntaxTree, WhitespacePolicy>();
    indentPolicies = new Map<SyntaxTree, boolean>();

    addEdit(edit: TextChange) {
        this._edits.push(edit);
    }

    getWhitespacePolicy(tree: SyntaxTree): WhitespacePolicy {
        return this.whitespacePolicies.get(tree) ?? WhitespacePolicy.disallowed;
    }

    getIndentPolicy(tree: SyntaxTree): boolean {
        return this.indentPolicies.get(tree) ?? false;
    }

    addPolicy(tree: SyntaxTree, whitespacePolicy: WhitespacePolicy, indentPolicy: boolean) {
        this.whitespacePolicies.set(tree, whitespacePolicy);
        this.indentPolicies.set(tree, indentPolicy);
    }

    get edits(): TextChange[] {
        return this._edits;
    }
}

enum WhitespacePolicy {
    disallowed,
    shouldNotBe,
    shouldBe
}

interface SkippedTextLine {
    readonly textOffset: number;
    readonly length: number;
}