import { JSONValue } from "./json/json-types";
import { NodeList } from "./values/node-list";
import { defaultQueryOptions, QueryOptions } from "./options";
import { Query } from "./query/query";
import { TypeChecker } from "./semantic-analysis/type-checker";
import { Parser } from "./syntax-analysis/parser";
import { removeAtPaths, replaceAtPaths } from "./transformations";

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
        const paths = nodes.buildPaths();
        replacer = typeof replacer !== "function" 
            ? (() => replacer as JSONValue) 
            : replacer;
        return replaceAtPaths(queryArgument, paths, replacer);
    }

    static remove(queryText: string, queryArgument: JSONValue, queryOptions: QueryOptions = defaultQueryOptions): JSONValue | undefined {
        const nodes = this.select(queryText, queryArgument, queryOptions);
        const paths = nodes.buildPaths();
        return removeAtPaths(queryArgument, paths);
    }

    static parse(queryText: string, queryOptions: QueryOptions = defaultQueryOptions): Query {
        const parser = new Parser();
        const typeChecker = new TypeChecker(queryOptions);
        const query = parser.parse(queryText);
        if (query.syntaxDiagnostics.length !== 0)
            throw new Error("");
        const typeCheckerDiagnostics = typeChecker.check(query);
        if (typeCheckerDiagnostics.length !== 0)
            throw new Error("");
        return query;
    }
}