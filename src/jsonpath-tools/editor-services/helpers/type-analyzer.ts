import { JSONPathAndExpression } from "@/jsonpath-tools/query/filter-expression/and-expression";
import { JSONPathBooleanLiteral } from "@/jsonpath-tools/query/filter-expression/boolean-literal";
import { JSONPathComparisonExpression } from "@/jsonpath-tools/query/filter-expression/comparison-expression";
import { JSONPathFilterExpression } from "@/jsonpath-tools/query/filter-expression/filter-expression";
import { JSONPathFilterQueryExpression } from "@/jsonpath-tools/query/filter-expression/filter-query-expression";
import { JSONPathNotExpression } from "@/jsonpath-tools/query/filter-expression/not-expression";
import { JSONPathNullLiteral } from "@/jsonpath-tools/query/filter-expression/null-literal";
import { JSONPathNumberLiteral } from "@/jsonpath-tools/query/filter-expression/number-literal";
import { JSONPathOrExpression } from "@/jsonpath-tools/query/filter-expression/or-expression";
import { JSONPathStringLiteral } from "@/jsonpath-tools/query/filter-expression/string-literal";
import { JSONPathQuery } from "@/jsonpath-tools/query/query";
import { JSONPathSegment } from "@/jsonpath-tools/query/segment";
import { JSONPathFilterSelector } from "@/jsonpath-tools/query/selectors/filter-selector";
import { JSONPathIndexSelector } from "@/jsonpath-tools/query/selectors/index-selector";
import { JSONPathNameSelector } from "@/jsonpath-tools/query/selectors/name-selector";
import { JSONPathWildcardSelector } from "@/jsonpath-tools/query/selectors/wildcard-selector";
import { JSONPathSyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { JSONPathSyntaxTreeType } from "@/jsonpath-tools/query/syntax-tree-type";
import { JSONPathToken } from "@/jsonpath-tools/query/token";
import { JSONPathNormalizedPath } from "@/jsonpath-tools/transformations";
import { Type, LiteralType, PrimitiveType, PrimitiveTypeType, AnyType, UnionType, intersectTypes, subtractTypes, NeverType } from "./types";

export class TypeAnalyzer {
    private readonly typeCache = new Map<JSONPathSyntaxTree, Type>();

    constructor(readonly rootType: Type) {

    }

    getType(expression: JSONPathSyntaxTree): Type {
        const fromCache = this.typeCache.get(expression);
        if (fromCache !== undefined)
            return fromCache;

        // TODO
        let type: Type;
        if (expression instanceof JSONPathStringLiteral)
            type = new LiteralType(expression.value);
        else if (expression instanceof JSONPathNumberLiteral)
            type = new LiteralType(expression.value);
        else if (expression instanceof JSONPathBooleanLiteral)
            type = new LiteralType(expression.value);
        else if (expression instanceof JSONPathNullLiteral)
            type = new PrimitiveType(PrimitiveTypeType.null);
        else if (expression.type === JSONPathSyntaxTreeType.atToken)
            type = this.getCurrentIdentifierType(expression as JSONPathToken);
        else if (expression.type === JSONPathSyntaxTreeType.dollarToken)
            type = this.getRootIdentifierType(expression as JSONPathToken);
        else if (expression instanceof JSONPathFilterSelector)
            type = this.getFilterSelectorType(expression);
        else if (expression instanceof JSONPathWildcardSelector)
            type = this.getWildcardSelectorType(expression);
        else if (expression instanceof JSONPathNameSelector)
            type = this.getNameSelectorType(expression);
        else if (expression instanceof JSONPathIndexSelector)
            type = this.getIndexSelectorType(expression);
        else if (expression instanceof JSONPathSegment)
            type = this.getSegmentType(expression);
        else
            type = AnyType.instance;

        this.typeCache.set(expression, type);
        return type;
    }

    private getFilterSelectorType(filterSelector: JSONPathFilterSelector): Type {
        const previousSegmentType = this.getPreviousSegmentType(filterSelector);
        const childrenType = previousSegmentType.getChildrenType();
        const narrowedType = this.narrowTypeByExpression(childrenType, filterSelector.expression, true);
        return narrowedType;
    }

    private getSegmentType(segment: JSONPathSegment): Type {
        const selectorTypes = segment.selectors.map(selector => this.getType(selector.selector));
        return new UnionType(selectorTypes).simplify();
    }

    private getWildcardSelectorType(wildcardSelector: JSONPathWildcardSelector): Type {
        const previousSegmentType = this.getPreviousSegmentType(wildcardSelector);
        return previousSegmentType.getChildrenType();
    }

    private getNameSelectorType(nameSelector: JSONPathNameSelector): Type {
        const previousSegmentType = this.getPreviousSegmentType(nameSelector);
        return previousSegmentType.getTypeAtProperty(nameSelector.name);
    }

    private getIndexSelectorType(indexSelector: JSONPathIndexSelector): Type {
        const previousSegmentType = this.getPreviousSegmentType(indexSelector);
        return previousSegmentType.getTypeAtIndex(indexSelector.index);
    }

    private getCurrentIdentifierType(currentIdentifier: JSONPathToken): Type {
        const previousSegmentType = this.getPreviousSegmentType(currentIdentifier);
        return previousSegmentType.getChildrenType();
    }

    private getRootIdentifierType(rootIdentifier: JSONPathToken): Type {
        return this.rootType;
    }

    private getPreviousSegmentType(tree: JSONPathSyntaxTree): Type {
        let segment: JSONPathSyntaxTree = tree;
        while (!(segment instanceof JSONPathSegment)) segment = segment.parent;
        const query = segment.parent as JSONPathQuery;
        const segmentIndex = query.segments.indexOf(segment);
        const previousSegment = segmentIndex === 0 ? query.identifierToken : query.segments[segmentIndex - 1];
        return this.getType(previousSegment);
    }

    private narrowTypeByExpression(type: Type, expression: JSONPathFilterExpression, isTrue: boolean): Type {
        // TODO
        if (expression instanceof JSONPathComparisonExpression) {
            return this.narrowTypeByComparison(type, expression, isTrue);
        }
        if (expression instanceof JSONPathAndExpression) {
            return this.narrowTypeByAnd(type, expression, isTrue);
        }
        if (expression instanceof JSONPathOrExpression) {
            return this.narrowTypeByOr(type, expression, isTrue);
        }
        if (expression instanceof JSONPathNotExpression) {
            return this.narrowTypeByNot(type, expression, isTrue);
        }
        return type;
    }

    private narrowTypeByComparison(type: Type, expression: JSONPathComparisonExpression, isTrue: boolean): Type {
        if (expression.operator !== "==" && expression.operator !== "!=")
            return type;

        if (expression.operator === "!=")
            isTrue = !isTrue;

        if (expression.left instanceof JSONPathFilterQueryExpression) {
            const path = queryToPath(expression.left.query);
            const leftType = type.getTypeAtPath(path);
            const rightType = this.getType(expression.right);
            const newType = isTrue ? intersectTypes(leftType, rightType) : subtractTypes(leftType, rightType);
            return type.setTypeAtPath(path, newType);
        }
        return type;
    }

    private narrowTypeByAnd(type: Type, andExpression: JSONPathAndExpression, isTrue: boolean): Type {
        if (isTrue) {
            let narrowedType = type;
            for (const childExpression of andExpression.expressions)
                narrowedType = this.narrowTypeByExpression(narrowedType, childExpression.expression, true);
            return narrowedType;
        }
        else {
            let narrowedType = NeverType.instance;
            for (const childExpression of andExpression.expressions)
                narrowedType = new UnionType([narrowedType, this.narrowTypeByExpression(type, childExpression.expression, false)]).simplify();
            return narrowedType;
        }
    }

    private narrowTypeByOr(type: Type, orExpression: JSONPathOrExpression, isTrue: boolean): Type {
        if (isTrue) {
            let narrowedType = NeverType.instance;
            for (const childExpression of orExpression.expressions)
                narrowedType = new UnionType([narrowedType, this.narrowTypeByExpression(type, childExpression.expression, true)]).simplify();
            return narrowedType;
        }
        else {
            let narrowedType = type;
            for (const childExpression of orExpression.expressions)
                narrowedType = this.narrowTypeByExpression(narrowedType, childExpression.expression, false);
            return narrowedType;
        }
    }

    private narrowTypeByNot(type: Type, expression: JSONPathNotExpression, isTrue: boolean): Type {
        return this.narrowTypeByExpression(type, expression.expression, !isTrue);
    }
}


function queryToPath(query: JSONPathQuery): JSONPathNormalizedPath {
    return query.segments.map(segment => {
        // TODO: Multiple selectors.
        const selector = segment.selectors[0].selector;
        if (selector instanceof JSONPathNameSelector)
            return selector.name;
        else if (selector instanceof JSONPathIndexSelector)
            return selector.index;
        else
            throw new Error("Invalid selector.");
    });
}