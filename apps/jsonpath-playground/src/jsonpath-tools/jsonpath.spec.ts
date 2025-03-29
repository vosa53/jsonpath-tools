import { describe, it, expect } from "vitest";
import { JSONPath, JSONPathError } from "./jsonpath";
import { stringifySyntaxTree } from "./helpers/utils";

describe("JSONPath", () => {
    it("select - Returns selected nodes", () => {
        const result = JSONPath.select(`$.items[?search(@.name, "[aA]pple")].price`, testQueryArgument);
        expect(result.createValues()).toEqual([19, 30]);
        expect(result.createNormalizedPaths()).toEqual([
            ["items", 0, "price"],
            ["items", 2, "price"]
        ]);
    });

    it("select - Invalid query throws JSONPath error", () => {
        expect(() => JSONPath.select(`abc`, testQueryArgument)).toThrow(JSONPathError);
    });

    it("replace - Replaces selected nodes with a constant value", () => {
        const result = JSONPath.replace(`$.items[?search(@.name, "[aA]pple")].price`, testQueryArgument, 10);
        expect(result).toEqual({
            items: [
                {
                    price: 10,
                    name: "Apple"
                },
                {
                    price: 14,
                    name: "Orange"
                },
                {
                    price: 10,
                    name: "Pineapple"
                }
            ]
        });
    });

    it("replace - Replaces selected nodes with a value from a function", () => {
        const result = JSONPath.replace(`$.items[?search(@.name, "[aA]pple")].price`, testQueryArgument, v => v as number + 5);
        expect(result).toEqual({
            items: [
                {
                    price: 24,
                    name: "Apple"
                },
                {
                    price: 14,
                    name: "Orange"
                },
                {
                    price: 35,
                    name: "Pineapple"
                }
            ]
        });
    });

    it("replace - Invalid query throws JSONPath error", () => {
        expect(() => JSONPath.replace(`abc`, testQueryArgument, 0)).toThrow(JSONPathError);
    });

    it("remove - Removes selected nodes", () => {
        const result = JSONPath.remove(`$.items[?search(@.name, "[aA]pple")].price`, testQueryArgument);
        expect(result).toEqual({
            items: [
                {
                    name: "Apple"
                },
                {
                    price: 14,
                    name: "Orange"
                },
                {
                    name: "Pineapple"
                }
            ]
        });
    });

    it("remove - Invalid query throws JSONPath error", () => {
        expect(() => JSONPath.remove(`abc`, testQueryArgument)).toThrow(JSONPathError);
    });

    it("parse - Returns parsed query", () => {
        const query = JSONPath.parse(`$.abc`);
        expect(stringifySyntaxTree(query)).toBe(`Query
    SubQuery
        DollarToken "$"
        Segment
            DotToken "."
            NameSelector
                NameToken "abc"
    EndOfFileToken ""
`);
    });

    it("parse - Syntactically invalid query throws JSONPath error", () => {
        expect(() => JSONPath.parse(`abc`)).toThrow(JSONPathError);
    });

    it("parse - Semantically invalid query throws JSONPath error", () => {
        expect(() => JSONPath.parse(`$.abc[?unknown(@)]`)).toThrow(JSONPathError);
    });
});

const testQueryArgument = {
    items: [
        {
            price: 19,
            name: "Apple"
        },
        {
            price: 14,
            name: "Orange"
        },
        {
            price: 30,
            name: "Pineapple"
        }
    ]
};