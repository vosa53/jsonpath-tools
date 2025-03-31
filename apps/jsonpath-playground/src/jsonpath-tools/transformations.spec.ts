import { describe, expect, it } from "vitest";
import { replaceAtPaths } from "./transformations";

describe("Transformations", () => {
    it("replaceAtPaths - Replaces an element in an array", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["items", 1]
        ], () => "new value");
        expect(replaced).toEqual({
            items: [
                {
                    price: 19,
                    name: "Apple"
                },
                "new value",
                {
                    price: 30,
                    name: "Pineapple"
                }
            ],
            public: true
        });
    });

    it("replaceAtPaths - Replaces a property in an object", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["public"]
        ], () => "new value");
        expect(replaced).toEqual({
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
            ],
            public: "new value"
        });
    });

    it("replaceAtPaths - Replaces values at the multiple paths", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["items", 0],
            ["public"],
            ["items", 2, "name"]
        ], () => "new value");
        expect(replaced).toEqual({
            items: [
                "new value",
                {
                    price: 14,
                    name: "Orange"
                },
                {
                    price: 30,
                    name: "new value"
                }
            ],
            public: "new value"
        });
    });

    it("replaceAtPaths - Replaces a value dynamically with a function", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["items"]
        ], (v: any) => v.length);
        expect(replaced).toEqual({
            items: 3,
            public: true
        });
    });

    it("replaceAtPaths - Replaces the root", () => {
        const replaced = replaceAtPaths(createTestData(), [
            []
        ], () => "new value");
        expect(replaced).toEqual("new value");
    });

    it("replaceAtPaths - Replaces at nested paths", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["items"],
            ["items", 1]
        ], () => "new value");
        expect(replaced).toEqual({
            items: "new value",
            public: true
        });
    });

    it("replaceAtPaths - Nested paths are evaluated post-order", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["items"],
            ["items", 1]
        ], (v: any) => {
            if (Array.isArray(v))
                v[1].name = "outer";
            else
                v.name = "inner";
            return v;
        });
        expect(replaced).toEqual({
            items: [
                {
                    price: 19,
                    name: "Apple"
                },
                {
                    price: 14,
                    name: "outer"
                },
                {
                    price: 30,
                    name: "Pineapple"
                }
            ],
            public: true
        });
    });

    it("replaceAtPaths - Same path multiple times is evaluated only once", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["items", 1, "price"],
            ["items", 2, "price"],
            ["items", 1, "price"]
        ], p => p as number + 1);
        expect(replaced).toEqual({
            items: [
                {
                    price: 19,
                    name: "Apple"
                },
                {
                    price: 15,
                    name: "Orange"
                },
                {
                    price: 31,
                    name: "Pineapple"
                }
            ],
            public: true
        });
    });

    it("replaceAtPaths - Non-existing property is ignored", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["someNotExistentProperty"]
        ], () => "new value");
        expect(replaced).toEqual(createTestData());
    });

    it("replaceAtPaths - Non-existing index is ignored", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["inventory", 3]
        ], () => "new value");
        expect(replaced).toEqual(createTestData());
    });

    it("replaceAtPaths - Undefined removes an element from an array", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["items", 1]
        ], () => undefined);
        expect(replaced).toEqual({
            items: [
                {
                    price: 19,
                    name: "Apple"
                },
                {
                    price: 30,
                    name: "Pineapple"
                }
            ],
            public: true
        });
    });

    it("replaceAtPaths - Undefined removes a property from an object", () => {
        const replaced = replaceAtPaths(createTestData(), [
            ["public"]
        ], () => undefined);
        expect(replaced).toEqual({
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
        });
    });

    it("replaceAtPaths - Root can be removed too", () => {
        const replaced = replaceAtPaths(createTestData(), [
            []
        ], () => undefined);
        expect(replaced).toEqual(undefined);
    });

    it("replaceAtPaths - Replace is immutable (the input value is unchanged)", () => {
        const data = createTestData();
        replaceAtPaths(data, [
            ["items", 0],
            ["public"],
            ["items", 2, "name"]
        ], () => "new value");
        expect(data).toEqual(createTestData());
    });
});

function createTestData() {
    return {
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
        ],
        public: true
    };
}