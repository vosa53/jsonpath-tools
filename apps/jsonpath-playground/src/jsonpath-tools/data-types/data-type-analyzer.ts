import { AndExpression } from "@/jsonpath-tools/query/filter-expression/and-expression";
import { BooleanLiteralExpression } from "@/jsonpath-tools/query/filter-expression/boolean-literal-expression";
import { ComparisonExpression, JSONPathComparisonOperator } from "@/jsonpath-tools/query/filter-expression/comparison-expression";
import { FilterExpression } from "@/jsonpath-tools/query/filter-expression/filter-expression";
import { FilterQueryExpression } from "@/jsonpath-tools/query/filter-expression/filter-query-expression";
import { NotExpression } from "@/jsonpath-tools/query/filter-expression/not-expression";
import { NullLiteralExpression } from "@/jsonpath-tools/query/filter-expression/null-literal-expression";
import { NumberLiteralExpression } from "@/jsonpath-tools/query/filter-expression/number-literal-expression";
import { OrExpression } from "@/jsonpath-tools/query/filter-expression/or-expression";
import { StringLiteralExpression } from "@/jsonpath-tools/query/filter-expression/string-literal-expression";
import { SubQuery } from "@/jsonpath-tools/query/sub-query";
import { Segment } from "@/jsonpath-tools/query/segment";
import { FilterSelector } from "@/jsonpath-tools/query/selectors/filter-selector";
import { IndexSelector } from "@/jsonpath-tools/query/selectors/index-selector";
import { NameSelector } from "@/jsonpath-tools/query/selectors/name-selector";
import { WildcardSelector } from "@/jsonpath-tools/query/selectors/wildcard-selector";
import { SyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { SyntaxTreeType } from "@/jsonpath-tools/query/syntax-tree-type";
import { SyntaxTreeToken } from "@/jsonpath-tools/query/syntax-tree-token";
import { DataType, LiteralDataType, PrimitiveDataType, PrimitiveDataTypeType, AnyDataType, UnionDataType, NeverDataType } from "./data-types";
import { intersectTypes, subtractTypes, isSubtypeOf, isEquvivalentTypeWith } from "./operations";
import { SliceSelector } from "../query/selectors/slice-selector";
import { FunctionExpression } from "../query/filter-expression/function-expression";
import { QueryOptions } from "../options";
import { ParanthesisExpression } from "../query/filter-expression/paranthesis-expression";
import { MissingSelector } from "../query/selectors/missing-selector";
import { MissingExpression } from "../query/filter-expression/missing-expression";

export class DataTypeAnalyzer {
    private readonly typeCache = new Map<SyntaxTree, DataType>();

    constructor(private readonly rootType: DataType, private readonly options: QueryOptions) {

    }

    getType(tree: SyntaxTree): DataType {
        const fromCache = this.typeCache.get(tree);
        if (fromCache !== undefined)
            return fromCache;

        let type: DataType;
        if (tree instanceof StringLiteralExpression)
            type = LiteralDataType.create(tree.value);
        else if (tree instanceof NumberLiteralExpression)
            type = LiteralDataType.create(tree.value);
        else if (tree instanceof BooleanLiteralExpression)
            type = LiteralDataType.create(tree.value);
        else if (tree instanceof NullLiteralExpression)
            type = PrimitiveDataType.create(PrimitiveDataTypeType.null);
        else if (tree instanceof ParanthesisExpression)
            type = this.getType(tree.expression);
        else if (tree.type === SyntaxTreeType.atToken)
            type = this.getCurrentIdentifierType(tree as SyntaxTreeToken);
        else if (tree.type === SyntaxTreeType.dollarToken)
            type = this.getRootIdentifierType(tree as SyntaxTreeToken);
        else if (tree instanceof FilterSelector)
            type = this.getFilterSelectorType(tree);
        else if (tree instanceof WildcardSelector)
            type = this.getWildcardSelectorType(tree);
        else if (tree instanceof NameSelector)
            type = this.getNameSelectorType(tree);
        else if (tree instanceof IndexSelector)
            type = this.getIndexSelectorType(tree);
        else if (tree instanceof SliceSelector)
            type = this.getSliceSelectorType(tree);
        else if (tree instanceof MissingSelector)
            type = NeverDataType.create();
        else if (tree instanceof Segment)
            type = this.getSegmentType(tree);
        else if (tree instanceof SubQuery)
            type = this.getQueryType(tree);
        else if (tree instanceof FilterQueryExpression)
            type = this.getFilterQueryType(tree);
        else if (tree instanceof FunctionExpression)
            type = this.getFunctionType(tree);
        else if (tree instanceof MissingExpression)
            type = NeverDataType.create();
        else
            type = AnyDataType.create();

        this.typeCache.set(tree, type);
        return type;
    }
    
    private getSegmentType(segment: Segment): DataType {
        const selectorTypes = segment.selectors.map(selector => this.getType(selector.selector));
        return UnionDataType.create(selectorTypes);
    }
    
    private getFilterSelectorType(filterSelector: FilterSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(filterSelector);
        const childrenType = previousSegmentType.getChildrenType();
        const narrowedType = this.narrowTypeByExpression(childrenType, filterSelector.expression, true);
        return narrowedType;
    }

    private getWildcardSelectorType(wildcardSelector: WildcardSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(wildcardSelector);
        return previousSegmentType.getChildrenType();
    }

    private getNameSelectorType(nameSelector: NameSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(nameSelector);
        return previousSegmentType.getTypeAtPathSegment(nameSelector.name);
    }

    private getIndexSelectorType(indexSelector: IndexSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(indexSelector);
        return previousSegmentType.getTypeAtPathSegment(indexSelector.index);
    }

    private getSliceSelectorType(indexSelector: SliceSelector): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(indexSelector);
        // It's not worth dealing with special cases for now, just consider wider type (corresponds to ::).
        return previousSegmentType.getChildrenType();
    }

    private getCurrentIdentifierType(currentIdentifier: SyntaxTreeToken): DataType {
        const previousSegmentType = this.getIncomingTypeToSegment(currentIdentifier);
        return previousSegmentType.getChildrenType();
    }

    private getRootIdentifierType(rootIdentifier: SyntaxTreeToken): DataType {
        return this.rootType;
    }

    private getQueryType(query: SubQuery): DataType {
        return query.segments.length === 0 
            ? this.getType(query.identifierToken) 
            : this.getSegmentType(query.segments[query.segments.length - 1]);
    }

    private getFilterQueryType(filterQuery: FilterQueryExpression): DataType {
        let type = this.getQueryType(filterQuery.query);
        if (filterQuery.parent instanceof ComparisonExpression)
            type = UnionDataType.create([type, PrimitiveDataType.create(PrimitiveDataTypeType.nothing)]);
        return type;
    }

    private getFunctionType(functionExpression: FunctionExpression): DataType {
        const functionDefinition = this.options.functions[functionExpression.name];
        if (functionDefinition === undefined)
            return NeverDataType.create();
        return functionDefinition.returnDataType;
    }

    getIncomingTypeToSegment(tree: SyntaxTree): DataType {
        let segment: SyntaxTree | null = tree;
        while (segment !== null && !(segment instanceof Segment)) segment = segment.parent;
        if (segment === null)
            return NeverDataType.create();
        const query = segment.parent as SubQuery;
        const segmentIndex = query.segments.indexOf(segment);
        const previousSegment = segmentIndex === 0 ? query.identifierToken : query.segments[segmentIndex - 1];
        const previousSegmentType = this.getType(previousSegment);
        if (segment.isDescendant)
            return UnionDataType.create([previousSegmentType, previousSegmentType.getDescendantType()]);
        else
            return previousSegmentType;
    }

    private narrowTypeByExpression(type: DataType, expression: FilterExpression, isTrue: boolean): DataType {
        if (expression instanceof ComparisonExpression)
            return this.narrowTypeByComparison(type, expression, isTrue);
        else if (expression instanceof FilterQueryExpression)
            return this.narrowTypeByFilterQuery(type, expression, isTrue);
        else if (expression instanceof AndExpression)
            return this.narrowTypeByAnd(type, expression, isTrue);
        else if (expression instanceof OrExpression)
            return this.narrowTypeByOr(type, expression, isTrue);
        else if (expression instanceof NotExpression)
            return this.narrowTypeByNot(type, expression, isTrue);
        else
            return type;
    }

    private narrowTypeByComparison(type: DataType, comparisonExpression: ComparisonExpression, isTrue: boolean): DataType {
        if (comparisonExpression.operator !== JSONPathComparisonOperator.equals && comparisonExpression.operator !== JSONPathComparisonOperator.notEquals)
            return type;

        if (comparisonExpression.operator === JSONPathComparisonOperator.notEquals)
            isTrue = !isTrue;

        let narrowedType = type;
        narrowedType = this.narrowTypeByEquals(narrowedType, comparisonExpression.left, comparisonExpression.right, isTrue);
        narrowedType = this.narrowTypeByEquals(narrowedType, comparisonExpression.right, comparisonExpression.left, isTrue);
        return narrowedType;
    }

    private narrowTypeByEquals(type: DataType, sideToNarrow: FilterExpression, otherSide: FilterExpression, isTrue: boolean): DataType {
        if (!(sideToNarrow instanceof FilterQueryExpression) || !sideToNarrow.query.isRelative)
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

    private narrowTypeByFilterQuery(type: DataType, filterQueryExpression: FilterQueryExpression, isTrue: boolean): DataType {
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

    private narrowTypeByAnd(type: DataType, andExpression: AndExpression, isTrue: boolean): DataType {
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

    private narrowTypeByOr(type: DataType, orExpression: OrExpression, isTrue: boolean): DataType {
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

    private narrowTypeByNot(type: DataType, expression: NotExpression, isTrue: boolean): DataType {
        return this.narrowTypeByExpression(type, expression.expression, !isTrue);
    }
}
