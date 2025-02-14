import { describe, expect, it } from 'vitest';

import cts from "./jsonpath-compliance-test-suite/cts.json";
import { JSONPathParser } from './syntax-analysis/parser';
import { TypeChecker } from './semantic-analysis/type-checker';
import { defaultJSONPathOptions } from './options';
import { deepEquals } from './types';

describe("JSONPath Compliance Test Suite", () => {
    for (const test of cts.tests) {
        it(test.name, () => {
            const parser = new JSONPathParser();
            const typeChecker = new TypeChecker();
            const pathSource = test.selector;
            const path = parser.parse(pathSource);
            const errorsCount = path.syntaxDiagnostics.length + typeChecker.check(path, defaultJSONPathOptions).length;

            if (test.invalid_selector === true) {
                expect(errorsCount).toBeGreaterThan(0);
            }
            else {
                expect(errorsCount).toBe(0);
                if (test.document !== undefined) {
                    const result = path.select({ rootNode: test.document, options: defaultJSONPathOptions }).nodes;
                    if (test.results !== undefined) {
                        expect(test.results.some(r => deepEquals(r, result))).toBeTruthy();
                    }
                    if (test.result !== undefined)
                        expect(result).toEqual(test.result);
                }
            }
        });
    }
});
