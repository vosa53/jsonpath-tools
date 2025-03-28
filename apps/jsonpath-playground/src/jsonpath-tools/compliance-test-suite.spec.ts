import { describe, expect, it } from 'vitest';

import cts from "./jsonpath-compliance-test-suite/cts.json";
import { Parser } from './syntax-analysis/parser';
import { TypeChecker } from './semantic-analysis/type-checker';
import { defaultQueryOptions } from './options';
import { jsonDeepEquals } from "./json/deep-equals";
import { JSONValue } from './json/json-types';
import { serializedNormalizedPath } from './serialization/serialization';

describe("JSONPath Compliance Test Suite", () => {
    for (const test of cts.tests) {
        it(test.name, () => {
            const parser = new Parser();
            const typeChecker = new TypeChecker(defaultQueryOptions);
            const queryText = test.selector;
            const query = parser.parse(queryText);
            const errorCount = query.syntaxDiagnostics.length + typeChecker.check(query).length;

            if (test.invalid_selector === true)
                expect(errorCount).toBeGreaterThan(0);
            else {
                expect(errorCount).toBe(0);
                if (test.document !== undefined) {
                    const result = query.select({ argument: test.document as JSONValue, options: defaultQueryOptions });
                    const resultValues = result.nodes.map(n => n.value);
                    const resultPaths = result.nodes.map(n => serializedNormalizedPath(n.buildPath()));
                    if (test.result !== undefined)
                        expect(resultValues).toEqual(test.result);
                    if (test.results !== undefined)
                        expect(test.results.some(r => jsonDeepEquals(r as JSONValue, resultValues))).toBeTruthy();
                    if (test.result_paths !== undefined)
                        expect(resultPaths).toEqual(test.result_paths);
                    if (test.results_paths !== undefined)
                        expect(test.results_paths.some(r => jsonDeepEquals(r as JSONValue, resultPaths))).toBeTruthy();
                }
            }
        });
    }
});
