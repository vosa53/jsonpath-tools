import { JSONValue } from "./json/json-types";
import { NodeList } from "./values/node-list";
import { defaultQueryOptions, QueryOptions } from "./options";
import { Query } from "./query/query";
import { TypeChecker } from "./semantic-analysis/type-checker";
import { Parser } from "./syntax-analysis/parser";
import { removeAtPaths, replaceAtPaths } from "./transformations";
import { Diagnostics } from "./diagnostics";

export class JSONPath {
    static select(queryText: string, queryArgument: JSONValue, queryOptions: QueryOptions = defaultQueryOptions): NodeList {
        const query = this.parse(queryText);
        return query.select({
            argument: queryArgument,
            options: queryOptions
        });
    }

    static replace(queryText: string, queryArgument: JSONValue, replacer: JSONValue | ((value: JSONValue) => JSONValue | undefined), queryOptions: QueryOptions = defaultQueryOptions): JSONValue | undefined {
        const nodes = this.select(queryText, queryArgument, queryOptions);
        const paths = nodes.createNormalizedPaths();
        const replacerFunction = typeof replacer !== "function" 
            ? (() => replacer as JSONValue) 
            : replacer;
        return replaceAtPaths(queryArgument, paths, replacerFunction);
    }

    static remove(queryText: string, queryArgument: JSONValue, queryOptions: QueryOptions = defaultQueryOptions): JSONValue | undefined {
        const nodes = this.select(queryText, queryArgument, queryOptions);
        const paths = nodes.createNormalizedPaths();
        return removeAtPaths(queryArgument, paths);
    }

    static parse(queryText: string, queryOptions: QueryOptions = defaultQueryOptions): Query {
        const parser = new Parser();
        const typeChecker = new TypeChecker(queryOptions);
        const query = parser.parse(queryText);
        if (query.syntaxDiagnostics.length !== 0)
            throw new JSONPathError(query.syntaxDiagnostics);
        const typeCheckerDiagnostics = typeChecker.check(query);
        if (typeCheckerDiagnostics.length !== 0)
            throw new JSONPathError(typeCheckerDiagnostics);
        return query;
    }
}

export class JSONPathError extends Error {
    constructor(readonly diagnostics: readonly Diagnostics[]) {
        const message = diagnostics.map(d => d.toString()).join("\n");
        super(message);
    }
}