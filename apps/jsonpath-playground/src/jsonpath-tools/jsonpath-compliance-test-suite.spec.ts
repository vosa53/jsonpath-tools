import { describe, expect, it } from 'vitest';

import cts from "./jsonpath-compliance-test-suite/cts.json";
import { defaultQueryOptions } from './options';
import { jsonDeepEquals } from "./json/deep-equals";
import { JSONValue } from './json/json-types';
import { serializedNormalizedPath } from './serialization/serialization';
import { JSONPath } from './jsonpath';

// Tests the library for RFC 9535 standard compliance using https://github.com/jsonpath-standard/jsonpath-compliance-test-suite.
describe("JSONPath Compliance Test Suite", () => {
    for (const test of cts.tests) {
        it(test.name, () => {
            const queryText = test.selector;

            if (test.invalid_selector === true)
                expect(() => JSONPath.parse(queryText)).toThrow();
            else {
                const query = JSONPath.parse(queryText);
                if (test.document !== undefined) {
                    const result = query.select({ argument: test.document as JSONValue, options: defaultQueryOptions });
                    const resultValues = result.nodes.map(n => n.value);
                    const resultPaths = result.nodes.map(n => serializedNormalizedPath(n.toNormalizedPath()));
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
