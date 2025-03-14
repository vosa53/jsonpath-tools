import { describe, expect, it } from 'vitest';

import cts from "./jsonpath-compliance-test-suite/cts.json";
import { JSONPathParser } from './syntax-analysis/parser';
import { TypeChecker } from './semantic-analysis/type-checker';
import { defaultJSONPathOptions } from './options';
import { deepEquals } from './types';

describe("JSONPath Compliance Test Suite", () => {
    /*for (const test of cts.tests) {
        it(test.name, () => {
            const parser = new JSONPathParser();
            const typeChecker = new TypeChecker(defaultJSONPathOptions);
            const pathSource = test.selector;
            const path = parser.parse(pathSource);
            const errorsCount = path.syntaxDiagnostics.length + typeChecker.check(path).length;

            if (test.invalid_selector === true) {
                expect(errorsCount).toBeGreaterThan(0);
            }
            else {
                expect(errorsCount).toBe(0);
                if (test.document !== undefined) {
                    const result = path.select({ rootNode: test.document, options: defaultJSONPathOptions }).nodes.map(n => n.value);
                    if (test.results !== undefined) {
                        expect(test.results.some(r => deepEquals(r, result))).toBeTruthy();
                    }
                    if (test.result !== undefined)
                        expect(result).toEqual(test.result);
                }
            }
        });
    }*/
    /*it("should pass", () => {
        function validQueries() {
            return cts.tests
                .filter((testCase) => testCase.invalid_selector !== true)
                .map((testCase) => {
                    return [testCase.selector, testCase.document];
                });
        }

        function perf(repeat: number) {
            const parser = new JSONPathParser();
            const checker = new TypeChecker(defaultJSONPathOptions);
            const queries = validQueries();
            console.log(
                `repeating ${queries.length} queries on small datasets ${repeat} times`,
            );
            const start = performance.now();
            for (let i = 0; i < repeat; i++) {
                for (const [query, data] of queries) {
                    const path = parser.parse(query);
                    checker.check(path, defaultJSONPathOptions);
                    path.select({ rootNode: data, options: defaultJSONPathOptions });
                    //env.query(query, data);
                    // Array.from(env.lazyQuery(query, data));
                }
            }
            const stop = performance.now();
            return (stop - start) / 1e3;
        }

        console.log(perf(10000));
    }, 100_000);*/
});
