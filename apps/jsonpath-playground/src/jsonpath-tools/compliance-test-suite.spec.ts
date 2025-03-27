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
            const pathSource = test.selector;
            const path = parser.parse(pathSource);
            const errorsCount = path.syntaxDiagnostics.length + typeChecker.check(path).length;

            if (test.invalid_selector === true) {
                expect(errorsCount).toBeGreaterThan(0);
            }
            else {
                expect(errorsCount).toBe(0);
                if (test.document !== undefined) {
                    // @ts-ignore
                    const result = path.select({ rootNode: test.document, options: defaultQueryOptions }).nodes.map(n => n.value);
                    if (test.results !== undefined) {
                        // @ts-ignore
                        expect(test.results.some(r => jsonDeepEquals(r, result))).toBeTruthy();
                    }
                    if (test.result !== undefined)
                        expect(result).toEqual(test.result);
                }
            }
        });
    }
});
