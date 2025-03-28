import { describe, expect, it } from 'vitest';

import cts from "./jsonpath-compliance-test-suite/cts.json";
import { Parser } from './syntax-analysis/parser';
import { TypeChecker } from './semantic-analysis/type-checker';
import { defaultQueryOptions } from './options';
import { jsonDeepEquals } from "./json/deep-equals";

describe("JSONPath Compliance Test Suite", () => {
    for (const test of cts.tests) {
        it(test.name, () => {
            const parser = new Parser();
            const typeChecker = new TypeChecker(defaultQueryOptions);
            const queryText = test.selector;
            const query = parser.parse(queryText);
            const errorsCount = query.syntaxDiagnostics.length + typeChecker.check(query).length;

            if (test.invalid_selector === true)
                expect(errorsCount).toBeGreaterThan(0);
            else {
                expect(errorsCount).toBe(0);
                if (test.document !== undefined) {
                    // @ts-ignore
                    const result = query.select({ argument: test.document, options: defaultQueryOptions });
                    const resultValues = result.nodes.map(n => n.value);
                    const resultPaths = result.nodes.map(n => n.buildPath());
                    if (test.results !== undefined) {
                        // @ts-ignore
                        expect(test.results.some(r => jsonDeepEquals(r, resultValues))).toBeTruthy();
                    }
                    if (test.result !== undefined)
                        expect(resultValues).toEqual(test.result);
                }
            }
        });
    }
});
