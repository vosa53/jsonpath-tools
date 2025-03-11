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
import { Type, LiteralType, PrimitiveType, PrimitiveTypeType, AnyType, UnionType, intersectTypes, subtractTypes, NeverType, TypeUsageContext, isSubtypeOf, isEquvivalentTypeWith } from "./types";

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
            type = LiteralType.create(expression.value);
        else if (expression instanceof JSONPathNumberLiteral)
            type = LiteralType.create(expression.value);
        else if (expression instanceof JSONPathBooleanLiteral)
            type = LiteralType.create(expression.value);
        else if (expression instanceof JSONPathNullLiteral)
            type = PrimitiveType.create(PrimitiveTypeType.null);
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
        else if (expression instanceof JSONPathQuery)
            type = this.getQueryType(expression);
        else if (expression instanceof JSONPathFilterQueryExpression)
            type = this.getFilterQueryType(expression);
        else
            type = AnyType.create();

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
        return UnionType.create(selectorTypes);
    }

    private getWildcardSelectorType(wildcardSelector: JSONPathWildcardSelector): Type {
        const previousSegmentType = this.getPreviousSegmentType(wildcardSelector);
        return previousSegmentType.getChildrenType();
    }

    private getNameSelectorType(nameSelector: JSONPathNameSelector): Type {
        const previousSegmentType = this.getPreviousSegmentType(nameSelector);
        return previousSegmentType.getTypeAtPathSegment(nameSelector.name, TypeUsageContext.query);
    }

    private getIndexSelectorType(indexSelector: JSONPathIndexSelector): Type {
        const previousSegmentType = this.getPreviousSegmentType(indexSelector);
        return previousSegmentType.getTypeAtPathSegment(indexSelector.index, TypeUsageContext.query);
    }

    private getCurrentIdentifierType(currentIdentifier: JSONPathToken): Type {
        const previousSegmentType = this.getPreviousSegmentType(currentIdentifier);
        return previousSegmentType.getChildrenType();
    }

    private getRootIdentifierType(rootIdentifier: JSONPathToken): Type {
        return this.rootType;
    }

    private getQueryType(query: JSONPathQuery): Type {
        return query.segments.length === 0 
            ? this.getType(query.identifierToken) 
            : this.getSegmentType(query.segments[query.segments.length - 1]);
    }

    private getFilterQueryType(filterQuery: JSONPathFilterQueryExpression): Type {
        return this.getQueryType(filterQuery.query);
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
        if (expression instanceof JSONPathComparisonExpression)
            return this.narrowTypeByComparison(type, expression, isTrue);
        if (expression instanceof JSONPathFilterQueryExpression)
            return this.narrowTypeByFilterQuery(type, expression, isTrue);
        if (expression instanceof JSONPathAndExpression)
            return this.narrowTypeByAnd(type, expression, isTrue);
        if (expression instanceof JSONPathOrExpression)
            return this.narrowTypeByOr(type, expression, isTrue);
        if (expression instanceof JSONPathNotExpression)
            return this.narrowTypeByNot(type, expression, isTrue);
        return type;
    }

    private narrowTypeByComparison(type: Type, comparisonExpression: JSONPathComparisonExpression, isTrue: boolean): Type {
        if (comparisonExpression.operator !== "==" && comparisonExpression.operator !== "!=")
            return type;

        if (comparisonExpression.operator === "!=")
            isTrue = !isTrue;

        let narrowedType = type;
        narrowedType = this.narrowTypeByEquals(narrowedType, comparisonExpression.left, comparisonExpression.right, isTrue);
        narrowedType = this.narrowTypeByEquals(narrowedType, comparisonExpression.right, comparisonExpression.left, isTrue);
        return narrowedType;
    }

    private narrowTypeByEquals(type: Type, sideToNarrow: JSONPathFilterExpression, otherSide: JSONPathFilterExpression, isTrue: boolean): Type {
        if (!(sideToNarrow instanceof JSONPathFilterQueryExpression) || !sideToNarrow.query.isRelative || !sideToNarrow.query.isSingular)
            return type;
        const path = queryToPath(sideToNarrow.query);
        const otherType = this.getType(otherSide);
        let narrowedType = type.changeTypeAtPath(path, t => isTrue ? intersectTypes(t, otherType) : subtractTypes(t, otherType));
        const pathSurelyExists = isTrue && !isSubtypeOf(PrimitiveType.create(PrimitiveTypeType.nothing), otherType) ||
            !isTrue && isEquvivalentTypeWith(PrimitiveType.create(PrimitiveTypeType.nothing), otherType);
        if (pathSurelyExists)
            narrowedType = narrowedType.setPathExistence(path);
        return narrowedType;
    }

    private narrowTypeByFilterQuery(type: Type, filterQueryExpression: JSONPathFilterQueryExpression, isTrue: boolean): Type {
        if (!filterQueryExpression.query.isRelative || !filterQueryExpression.query.isSingular)
            return type;

        const path = queryToPath(filterQueryExpression.query);
        if (isTrue)
            return type.setPathExistence(path);
        else
            return type.changeTypeAtPath(path, t => intersectTypes(t, PrimitiveType.create(PrimitiveTypeType.nothing)));
    }

    private narrowTypeByAnd(type: Type, andExpression: JSONPathAndExpression, isTrue: boolean): Type {
        if (isTrue) {
            let narrowedType = type;
            for (const childExpression of andExpression.expressions)
                narrowedType = this.narrowTypeByExpression(narrowedType, childExpression.expression, true);
            return narrowedType;
        }
        else {
            let narrowedType = NeverType.create();
            for (const childExpression of andExpression.expressions)
                narrowedType = UnionType.create([narrowedType, this.narrowTypeByExpression(type, childExpression.expression, false)]);
            return narrowedType;
        }
    }

    private narrowTypeByOr(type: Type, orExpression: JSONPathOrExpression, isTrue: boolean): Type {
        if (isTrue) {
            let narrowedType = NeverType.create();
            for (const childExpression of orExpression.expressions)
                narrowedType = UnionType.create([narrowedType, this.narrowTypeByExpression(type, childExpression.expression, true)]);
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
        if (segment.selectors.length !== 1)
            throw new Error("Invalid segment.");
        const selector = segment.selectors[0].selector;
        if (selector instanceof JSONPathNameSelector)
            return selector.name;
        else if (selector instanceof JSONPathIndexSelector)
            return selector.index;
        else
            throw new Error("Invalid selector.");
    });
}