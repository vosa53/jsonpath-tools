import { JSONValue } from "./json/json-types";
import { NodeList } from "./values/node-list";
import { defaultQueryOptions, QueryOptions } from "./query-options";
import { Query } from "./query/query";
import { Checker } from "./semantic-analysis/checker";
import { Parser } from "./syntax-analysis/parser";
import { removeAtPaths, replaceAtPaths } from "./transformations";
import { Diagnostics } from "./diagnostics";

/**
 * JSONPath evaluator compliant with standard [RFC 9535](https://datatracker.ietf.org/doc/rfc9535/).
 */
export class JSONPath {
    /**
     * Executes the given query and returns the selected nodes.
     * @param queryText Text of the query.
     * @param queryArgument Argument of the query (JSON value the query is applied to).
     * @param queryOptions Query options.
     * @returns Selected nodes.
     * @throws {@link JSONPathError} When the query is not well-formed or valid.
     */
    static select(queryText: string, queryArgument: JSONValue, queryOptions: QueryOptions = defaultQueryOptions): NodeList {
        const query = this.parse(queryText);
        return query.select({
            argument: queryArgument,
            options: queryOptions
        });
    }

    /**
     * Executes the given query and replaces the selected nodes in the query argument with the specified value.
     * @param queryText Text of the query.
     * @param queryArgument Argument of the query (JSON value the query is applied to).
     * @param replacer JSON value that should be used as a replacement or a function to create that value based on the replaced value.
     * @param queryOptions Query options.
     * @returns Query argument with replaced values.
     * @throws {@link JSONPathError} When the query is not well-formed or valid.
     */
    static replace(queryText: string, queryArgument: JSONValue, replacer: JSONValue | ((value: JSONValue) => JSONValue | undefined), queryOptions: QueryOptions = defaultQueryOptions): JSONValue | undefined {
        const nodes = this.select(queryText, queryArgument, queryOptions);
        const paths = nodes.toNormalizedPaths();
        const replacerFunction = typeof replacer !== "function" 
            ? (() => replacer as JSONValue) 
            : replacer;
        return replaceAtPaths(queryArgument, paths, replacerFunction);
    }

    /**
     * Executes the given query and removes the selected nodes from the query argument.
     * @param queryText Text of the query.
     * @param queryArgument Argument of the query (JSON value the query is applied to).
     * @param queryOptions Query options.
     * @returns Query argument with removed values.
     * @throws {@link JSONPathError} When the query is not well-formed or valid.
     */
    static remove(queryText: string, queryArgument: JSONValue, queryOptions: QueryOptions = defaultQueryOptions): JSONValue | undefined {
        const nodes = this.select(queryText, queryArgument, queryOptions);
        const paths = nodes.toNormalizedPaths();
        return removeAtPaths(queryArgument, paths);
    }

    /**
     * Parses the given query for later execution or analysis.
     * @param queryText Text of the query.
     * @param queryOptions Query options.
     * @returns Parsed query (syntax tree).
     * @throws {@link JSONPathError} When the query is not well-formed or valid.
     */
    static parse(queryText: string, queryOptions: QueryOptions = defaultQueryOptions): Query {
        const parser = new Parser();
        const typeChecker = new Checker(queryOptions);
        const query = parser.parse(queryText);
        if (query.syntaxDiagnostics.length !== 0)
            throw new JSONPathError(query.syntaxDiagnostics);
        const typeCheckerDiagnostics = typeChecker.check(query);
        if (typeCheckerDiagnostics.length !== 0)
            throw new JSONPathError(typeCheckerDiagnostics);
        return query;
    }

    private constructor() { }
}

/**
 * Error meaning that a JSONPath query is not well-formed or valid.
 */
export class JSONPathError extends Error {
    constructor(
        /**
         * Diagnostics that caused the error.
         */
        readonly diagnostics: readonly Diagnostics[]
    ) {
        const message = diagnostics.map(d => d.toString()).join("\n");
        super(message);
    }
}