/**
 * JSONPath (RFC 9535) query evaluation, analysis and editor services.
 * @module @jsonpath-tools/jsonpath
 */

import { AnyDataType, ArrayDataType, DataType, DataTypeAnnotation, LiteralDataType, NeverDataType, ObjectDataType, PrimitiveDataType, UnionDataType } from "./data-types/data-types";
import { JSONSchema, JSONSchemaDictionary, jsonSchemaToType, JSONSchemaType, JSONSchemaWithURI, ObjectJSONSchema } from "./data-types/json-schema-data-type-converter";
import { JSONTypeDefinition, JSONTypeDefinitionDictionary, jsonTypeDefinitionToType, JSONTypeDefinitionType } from "./data-types/json-type-definition-data-type-converter";
import { Diagnostics, DiagnosticsSeverity } from "./diagnostics";
import { EditorService } from "./editor-services/editor-service";
import { JSONValue } from "./json/json-types";
import { JSONPath, JSONPathError } from "./jsonpath";
import { Node } from "./values/node";
import { NodeList } from "./values/node-list";
import { NormalizedPath, NormalizedPathSegment } from "./normalized-path";
import { defaultQueryOptions, QueryOptions } from "./query-options";
import { Function, FunctionContext, FunctionHandler, FunctionParameter } from "./functions/function";
import { Type } from "./values/types";
import { AndExpression } from "./query/filter-expressions/and-expression";
import { BooleanLiteralExpression } from "./query/filter-expressions/boolean-literal-expression";
import { ComparisonExpression, ComparisonOperator } from "./query/filter-expressions/comparison-expression";
import { FilterExpression } from "./query/filter-expressions/filter-expression";
import { FilterQueryExpression } from "./query/filter-expressions/filter-query-expression";
import { FunctionExpression } from "./query/filter-expressions/function-expression";
import { MissingExpression } from "./query/filter-expressions/missing-expression";
import { NotExpression } from "./query/filter-expressions/not-expression";
import { NullLiteralExpression } from "./query/filter-expressions/null-literal-expression";
import { NumberLiteralExpression } from "./query/filter-expressions/number-literal-expression";
import { OrExpression } from "./query/filter-expressions/or-expression";
import { ParanthesisExpression } from "./query/filter-expressions/paranthesis-expression";
import { StringLiteralExpression } from "./query/filter-expressions/string-literal-expression";
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
import { CompletionItem, CompletionItemTextType, CompletionItemType, CompletionService } from "./editor-services/completion-service";
import { Signature, SignatureHelpService, SignatureParameter } from "./editor-services/signature-help-service";
import { Tooltip, TooltipService } from "./editor-services/tooltip-service";
import { DocumentHighlight, DocumentHighlightsService } from "./editor-services/document-highlights-service";
import { FilterExpressionContext, QueryContext } from "./query/evaluation";
import { IndexOnlyArray, PushOnlyArray } from "./helpers/array";
import { serializeBoolean, serializedNormalizedPath, serializeLiteral, serializeNull, serializeNumber, serializeString } from "./serialization/serialization";
import { Parser } from "./syntax-analysis/parser";
import { Checker } from "./semantic-analysis/checker";
import { FormattingService } from "./editor-services/formatting-service";
import { SyntaxDescriptionService } from "./editor-services/syntax-description-service";

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

    Parser,
    Checker,

    serializedNormalizedPath,
    serializeLiteral,
    serializeString,
    serializeNumber,
    serializeBoolean,
    serializeNull,

    EditorService,
    CompletionService,
    DocumentHighlightsService,
    FormattingService,
    SignatureHelpService,
    SyntaxDescriptionService,
    TooltipService,
    CompletionItem,
    CompletionItemType,
    CompletionItemTextType,
    Signature,
    SignatureParameter,
    Tooltip,
    DocumentHighlight,

    AnyDataType, 
    ArrayDataType, 
    DataType, 
    DataTypeAnnotation, 
    LiteralDataType, 
    NeverDataType, 
    ObjectDataType, 
    PrimitiveDataType, 
    UnionDataType,
    jsonSchemaToType,
    jsonTypeDefinitionToType
};
