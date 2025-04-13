/**
 * JSONPath query evaluation, analysis and editor services.
 * @module @jsonpath-tools/jsonpath
 */

import { DataType, DataTypeAnnotation } from "./data-types/data-types";
import { JSONSchema, JSONSchemaDictionary, jsonSchemaToType, JSONSchemaType, JSONSchemaWithURI, ObjectJSONSchema } from "./data-types/json-schema-data-type-converter";
import { JSONTypeDefinition, JSONTypeDefinitionDictionary, jsonTypeDefinitionToType, JSONTypeDefinitionType } from "./data-types/json-type-definition-data-type-converter";
import { Diagnostics, DiagnosticsSeverity } from "./diagnostics";
import { EditorService } from "./editor-services/editor-service";
import { JSONValue } from "./json/json-types";
import { JSONPath, JSONPathError } from "./jsonpath";
import { Node } from "./values/node";
import { NodeList } from "./values/node-list";
import { NormalizedPath, NormalizedPathSegment } from "./normalized-path";
import { defaultQueryOptions, QueryOptions } from "./options";
import { Function, FunctionContext, FunctionHandler, FunctionParameter } from "./functions/function";
import { Type } from "./values/types";
import { AndExpression } from "./query/filter-expression/and-expression";
import { BooleanLiteralExpression } from "./query/filter-expression/boolean-literal-expression";
import { ComparisonExpression, ComparisonOperator } from "./query/filter-expression/comparison-expression";
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
import { Segment, SegmentType } from "./query/segment";
import { FilterSelector } from "./query/selectors/filter-selector";
import { IndexSelector } from "./query/selectors/index-selector";
import { MissingSelector } from "./query/selectors/missing-selector";
import { NameSelector } from "./query/selectors/name-selector";
import { Selector } from "./query/selectors/selector";
import { SliceSelector } from "./query/selectors/slice-selector";
import { WildcardSelector } from "./query/selectors/wildcard-selector";
import { QueryType, SubQuery } from "./query/sub-query";
import { SyntaxTree } from "./query/syntax-tree";
import { SyntaxTreeNode } from "./query/syntax-tree-node";
import { SyntaxTreeToken } from "./query/syntax-tree-token";
import { SyntaxTreeType } from "./query/syntax-tree-type";
import { TextChange } from "./text/text-change";
import { TextRange } from "./text/text-range";
import { removeAtPaths, replaceAtPaths } from "./transformations";
import { LogicalFalse, LogicalTrue, Nothing, ValueType, LogicalType, NodesType, isValueType, isNodesType, isLogicalType, FilterValue } from "./values/types";
import { CompletionItem, CompletionItemTextType, CompletionItemType } from "./editor-services/completion-service";
import { Signature, SignatureParameter } from "./editor-services/signature-help-service";
import { Tooltip } from "./editor-services/tooltip-service";
import { DocumentHighlight } from "./editor-services/document-highlights-service";
import { FilterExpressionContext, QueryContext } from "./query/evaluation";
import { IndexOnlyArray, PushOnlyArray } from "./helpers/array";

export type {
    JSONValue,

    QueryOptions,
    Function,
    FunctionParameter,
    FunctionHandler,
    FunctionContext,

    QueryContext,
    FilterExpressionContext,

    NormalizedPath,
    NormalizedPathSegment,

    FilterValue,
    ValueType,
    LogicalType,
    NodesType,

    Diagnostics,

    JSONSchemaWithURI,
    JSONSchema,
    ObjectJSONSchema,
    JSONSchemaDictionary,
    JSONSchemaType,
    JSONTypeDefinition,
    JSONTypeDefinitionDictionary,
    JSONTypeDefinitionType,

    IndexOnlyArray,
    PushOnlyArray
};

export { 
    JSONPath,
    JSONPathError,

    defaultQueryOptions,

    Type,

    DiagnosticsSeverity,

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
    QueryType,
    SubQuery,
    Segment,
    SegmentType,

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
    ComparisonOperator,

    EditorService,
    CompletionItem,
    CompletionItemType,
    CompletionItemTextType,
    Signature,
    SignatureParameter,
    Tooltip,
    DocumentHighlight,

    DataType,
    DataTypeAnnotation,
    jsonSchemaToType,
    jsonTypeDefinitionToType
};
