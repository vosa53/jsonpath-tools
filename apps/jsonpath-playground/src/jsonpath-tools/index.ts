/**
 * @module @jsonpath-tools/jsonpath
 */

import { DataType, DataTypeAnnotation } from "./data-types/data-types";
import { jsonSchemaToType } from "./data-types/json-schema-data-type-converter";
import { jsonTypeDefinitionToType } from "./data-types/json-type-definition-data-type-converter";
import { Diagnostics, DiagnosticsType } from "./diagnostics";
import { EditorService } from "./editor-services/editor-service";
import { JSONValue } from "./json/json-types";
import { JSONPath } from "./jsonpath";
import { Node } from "./values/node";
import { NodeList } from "./values/node-list";
import { NormalizedPath, NormalizedPathSegment } from "./normalized-path";
import { defaultQueryOptions, QueryOptions } from "./options";
import { Function, FunctionContext, FunctionHandler, FunctionParameter } from "./functions/function";
import { Type } from "./values/types";
import { AndExpression } from "./query/filter-expression/and-expression";
import { BooleanLiteralExpression } from "./query/filter-expression/boolean-literal-expression";
import { ComparisonExpression } from "./query/filter-expression/comparison-expression";
import { FilterExpression } from "./query/filter-expression/filter-expression";
import { FilterQueryExpression } from "./query/filter-expression/filter-query-expression";
import { FunctionExpression } from "./query/filter-expression/function-expression";
import { MissingExpression } from "./query/filter-expression/missing-expression";
import { NotExpression } from "./query/filter-expression/not-expression";
import { NullLiteralExpression } from "./query/filter-expression/null-literal-expression";
import { NumberLiteralExpression } from "./query/filter-expression/number-literal-expression";
import { OrExpression } from "./query/filter-expression/or-expression";
import { ParanthesisExpression } from "./query/filter-expression/paranthesis-expression";
import { StringLiteralExpression } from "./query/filter-expression/string-literal-expression";
import { Query } from "./query/query";
import { Segment } from "./query/segment";
import { FilterSelector } from "./query/selectors/filter-selector";
import { IndexSelector } from "./query/selectors/index-selector";
import { MissingSelector } from "./query/selectors/missing-selector";
import { NameSelector } from "./query/selectors/name-selector";
import { Selector } from "./query/selectors/selector";
import { SliceSelector } from "./query/selectors/slice-selector";
import { WildcardSelector } from "./query/selectors/wildcard-selector";
import { SubQuery } from "./query/sub-query";
import { SyntaxTree } from "./query/syntax-tree";
import { SyntaxTreeNode } from "./query/syntax-tree-node";
import { SyntaxTreeToken } from "./query/syntax-tree-token";
import { SyntaxTreeType } from "./query/syntax-tree-type";
import { TextChange } from "./text/text-change";
import { TextRange } from "./text/text-range";
import { removeAtPaths, replaceAtPaths } from "./transformations";
import { LogicalFalse, LogicalTrue, Nothing, ValueType, LogicalType, NodesType, isValueType, isNodesType, isLogicalType, FilterValue } from "./values/types";

export type {
    JSONValue,

    QueryOptions,
    Function,
    FunctionParameter,
    FunctionHandler,
    FunctionContext,

    NormalizedPath,
    NormalizedPathSegment,

    FilterValue,
    ValueType,
    LogicalType,
    NodesType,

    Diagnostics
}

export { 
    JSONPath,

    defaultQueryOptions,

    Type,

    DiagnosticsType,

    TextRange,
    TextChange,
    
    replaceAtPaths,
    removeAtPaths,

    isValueType,
    isLogicalType,
    isNodesType,

    Nothing,
    LogicalTrue,
    LogicalFalse,
    
    NodeList,
    Node,

    SyntaxTree,
    SyntaxTreeNode,
    SyntaxTreeToken,
    SyntaxTreeType,
    
    Query,
    SubQuery,
    Segment,

    Selector,
    NameSelector,
    IndexSelector,
    SliceSelector,
    WildcardSelector,
    FilterSelector,
    MissingSelector,

    FilterExpression,
    AndExpression,
    OrExpression,
    NotExpression,
    ParanthesisExpression,
    ComparisonExpression,
    FilterQueryExpression,
    FunctionExpression,
    StringLiteralExpression,
    NumberLiteralExpression,
    BooleanLiteralExpression,
    NullLiteralExpression,
    MissingExpression,

    EditorService,

    DataType,
    DataTypeAnnotation,
    jsonSchemaToType,
    jsonTypeDefinitionToType
};