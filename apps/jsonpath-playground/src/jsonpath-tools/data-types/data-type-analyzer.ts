import { JSONPathAndExpression } from "@/jsonpath-tools/query/filter-expression/and-expression";
import { JSONPathBooleanLiteral } from "@/jsonpath-tools/query/filter-expression/boolean-literal";
import { JSONPathComparisonExpression, JSONPathComparisonOperator } from "@/jsonpath-tools/query/filter-expression/comparison-expression";
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
import { DataType, LiteralDataType, PrimitiveDataType, PrimitiveDataTypeType, AnyDataType, UnionDataType, intersectTypes, subtractTypes, NeverDataType, isSubtypeOf, isEquvivalentTypeWith } from "./data-types";
import { JSONPathSliceSelector } from "../query/selectors/slice-selector";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPathOptions } from "../options";
import { JSONPathParanthesisExpression } from "../query/filter-expression/paranthesis-expression";
import { JSONPathMissingSelector } from "../query/selectors/missing-selector";
import { JSONPathMissingExpression } from "../query/filter-expression/missing-expression";

export class DataTypeAnalyzer {
    private readonly typeCache = new Map<JSONPathSyntaxTree, DataType>();

    constructor(private readonly rootType: DataType, private readonly options: JSONPathOptions) {

    }

    getType(tree: JSONPathSyntaxTree): DataType {
        const fromCache = this.typeCache.get(tree);
        if (fromCache !== undefined)
            return fromCache;

        let type: DataType;
        if (tree instanceof JSONPathStringLiteral)
            type = LiteralDataType.create(tree.value);
        else if (tree instanceof JSONPathNumberLiteral)
            type = LiteralDataType.create(tree.value);
        else if (tree instanceof JSONPathBooleanLiteral)
            type = LiteralDataType.create(tree.value);
        else if (tree instanceof JSONPathNullLiteral)
            type = PrimitiveDataType.create(PrimitiveDataTypeType.null);
        else if (tree instanceof JSONPathParanthesisExpression)
            type = this.getType(tree.expression);
        else if (tree.type === JSONPathSyntaxTreeType.atToken)
            type = this.getCurrentIdentifierType(tree as JSONPathToken);
        else if (tree.type === JSONPathSyntaxTreeType.dollarToken)
            type = this.getRootIdentifierType(tree as JSONPathToken);
        else if (tree instanceof JSONPathFilterSelector)
            type = this.getFilterSelectorType(tree);
        else if (tree instanceof JSONPathWildcardSelector)
            type = this.getWildcardSelectorType(tree);
        else if (tree instanceof JSONPathNameSelector)
            type = this.getNameSelectorType(tree);
        else if (tree instanceof JSONPathIndexSelector)
            type = this.getIndexSelectorType(tree);
        else if (tree instanceof JSONPathSliceSelector)
            type = this.getSliceSelectorType(tree);
        else if (tree instanceof JSONPathMissingSelector)
            type = NeverDataType.create();
        else if (tree instanceof JSONPathSegment)
            type = this.getSegmentType(tree);
        else if (tree instanceof JSONPathQuery)
            type = this.getQueryType(tree);
        else if (tree instanceof JSONPathFilterQueryExpression)
            type = this.getFilterQueryType(tree);
        else if (tree instanceof JSONPathFunctionExpression)
            type = this.getFunctionType(tree);
        else if (tree instanceof JSONPathMissingExpression)
            type = NeverDataType.create();
        else
            type = AnyDataType.create();

        this.typeCache.set(tree, type);
        return type;
    }
    
    private getSegmentType(segment: JSONPathSegment): DataType {
        const selectorTypes = segment.selectors.map(selector => this.getType(selector.selector));
        return UnionDataType.create(selectorTypes);
    }
    
    private getFilterSelectorType(filterSelector: JSONPathFilterSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(filterSelector);
        const childrenType = previousSegmentType.getChildrenType();
        const narrowedType = this.narrowTypeByExpression(childrenType, filterSelector.expression, true);
        return narrowedType;
    }

    private getWildcardSelectorType(wildcardSelector: JSONPathWildcardSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(wildcardSelector);
        return previousSegmentType.getChildrenType();
    }

    private getNameSelectorType(nameSelector: JSONPathNameSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(nameSelector);
        return previousSegmentType.getTypeAtPathSegment(nameSelector.name);
    }

    private getIndexSelectorType(indexSelector: JSONPathIndexSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(indexSelector);
        return previousSegmentType.getTypeAtPathSegment(indexSelector.index);
    }

    private getSliceSelectorType(indexSelector: JSONPathSliceSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(indexSelector);
        // It's not worth dealing with special cases for now, just consider wider type (corresponds to ::).
        return previousSegmentType.getChildrenType();
    }

    private getCurrentIdentifierType(currentIdentifier: JSONPathToken): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(currentIdentifier);
        return previousSegmentType.getChildrenType();
    }

    private getRootIdentifierType(rootIdentifier: JSONPathToken): DataType {
        return this.rootType;
    }

    private getQueryType(query: JSONPathQuery): DataType {
        return query.segments.length === 0 
            ? this.getType(query.identifierToken) 
            : this.getSegmentType(query.segments[query.segments.length - 1]);
    }

    private getFilterQueryType(filterQuery: JSONPathFilterQueryExpression): DataType {
        let type = this.getQueryType(filterQuery.query);
        if (filterQuery.parent instanceof JSONPathComparisonExpression)
            type = UnionDataType.create([type, PrimitiveDataType.create(PrimitiveDataTypeType.nothing)]);
        return type;
    }

    private getFunctionType(functionExpression: JSONPathFunctionExpression): DataType {
        const functionDefinition = this.options.functions[functionExpression.name];
        if (functionDefinition === undefined)
            return NeverDataType.create();
        return functionDefinition.returnDataType;
    }

    getIncomingTypeToSegment(tree: JSONPathSyntaxTree): DataType {
        let segment: JSONPathSyntaxTree = tree;
        while (!(segment instanceof JSONPathSegment)) segment = segment.parent!;
        const query = segment.parent as JSONPathQuery;
        const segmentIndex = query.segments.indexOf(segment);
        const previousSegment = segmentIndex === 0 ? query.identifierToken : query.segments[segmentIndex - 1];
        const previousSegmentType = this.getType(previousSegment);
        if (segment.isDescendant)
            return UnionDataType.create([previousSegmentType, previousSegmentType.getDescendantType()]);
        else
            return previousSegmentType;
    }

    private narrowTypeByExpression(type: DataType, expression: JSONPathFilterExpression, isTrue: boolean): DataType {
        if (expression instanceof JSONPathComparisonExpression)
            return this.narrowTypeByComparison(type, expression, isTrue);
        else if (expression instanceof JSONPathFilterQueryExpression)
            return this.narrowTypeByFilterQuery(type, expression, isTrue);
        else if (expression instanceof JSONPathAndExpression)
            return this.narrowTypeByAnd(type, expression, isTrue);
        else if (expression instanceof JSONPathOrExpression)
            return this.narrowTypeByOr(type, expression, isTrue);
        else if (expression instanceof JSONPathNotExpression)
            return this.narrowTypeByNot(type, expression, isTrue);
        else
            return type;
    }

    private narrowTypeByComparison(type: DataType, comparisonExpression: JSONPathComparisonExpression, isTrue: boolean): DataType {
        if (comparisonExpression.operator !== JSONPathComparisonOperator.equals && comparisonExpression.operator !== JSONPathComparisonOperator.notEquals)
            return type;

        if (comparisonExpression.operator === JSONPathComparisonOperator.notEquals)
            isTrue = !isTrue;

        let narrowedType = type;
        narrowedType = this.narrowTypeByEquals(narrowedType, comparisonExpression.left, comparisonExpression.right, isTrue);
        narrowedType = this.narrowTypeByEquals(narrowedType, comparisonExpression.right, comparisonExpression.left, isTrue);
        return narrowedType;
    }

    private narrowTypeByEquals(type: DataType, sideToNarrow: JSONPathFilterExpression, otherSide: JSONPathFilterExpression, isTrue: boolean): DataType {
        if (!(sideToNarrow instanceof JSONPathFilterQueryExpression) || !sideToNarrow.query.isRelative)
            return type;
        const path = sideToNarrow.query.toNormalizedPath();
        if (path === null)
            return type;
        const otherType = this.getType(otherSide);
        let narrowedType = type.changeTypeAtPath(path, t => isTrue ? intersectTypes(t, otherType) : subtractTypes(t, otherType));
        const pathSurelyExists = isTrue && !isSubtypeOf(PrimitiveDataType.create(PrimitiveDataTypeType.nothing), otherType) ||
            !isTrue && isEquvivalentTypeWith(PrimitiveDataType.create(PrimitiveDataTypeType.nothing), otherType);
        if (pathSurelyExists)
            narrowedType = narrowedType.setPathExistence(path);
        return narrowedType;
    }

    private narrowTypeByFilterQuery(type: DataType, filterQueryExpression: JSONPathFilterQueryExpression, isTrue: boolean): DataType {
        if (!filterQueryExpression.query.isRelative)
            return type;
        const path = filterQueryExpression.query.toNormalizedPath();
        if (path === null)
            return type;
        if (isTrue)
            return type.setPathExistence(path);
        else
            return type.changeTypeAtPath(path, t => intersectTypes(t, PrimitiveDataType.create(PrimitiveDataTypeType.nothing)));
    }

    private narrowTypeByAnd(type: DataType, andExpression: JSONPathAndExpression, isTrue: boolean): DataType {
        if (isTrue) {
            let narrowedType = type;
            for (const childExpression of andExpression.expressions)
                narrowedType = this.narrowTypeByExpression(narrowedType, childExpression.expression, true);
            return narrowedType;
        }
        else {
            let narrowedType = NeverDataType.create();
            for (const childExpression of andExpression.expressions)
                narrowedType = UnionDataType.create([narrowedType, this.narrowTypeByExpression(type, childExpression.expression, false)]);
            return narrowedType;
        }
    }

    private narrowTypeByOr(type: DataType, orExpression: JSONPathOrExpression, isTrue: boolean): DataType {
        if (isTrue) {
            let narrowedType = NeverDataType.create();
            for (const childExpression of orExpression.expressions)
                narrowedType = UnionDataType.create([narrowedType, this.narrowTypeByExpression(type, childExpression.expression, true)]);
            return narrowedType;
        }
        else {
            let narrowedType = type;
            for (const childExpression of orExpression.expressions)
                narrowedType = this.narrowTypeByExpression(narrowedType, childExpression.expression, false);
            return narrowedType;
        }
    }

    private narrowTypeByNot(type: DataType, expression: JSONPathNotExpression, isTrue: boolean): DataType {
        return this.narrowTypeByExpression(type, expression.expression, !isTrue);
    }
}
