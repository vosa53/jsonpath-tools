import { describe, it, expect } from "vitest";
import { Node } from "./node";

describe("Node", () => {
    it("buildPath - Empty path", () => {
        const node = new Node("test", "", null);
        expect(node.buildPath()).toEqual([]);
    });

    it("buildPath - Path", () => {
        const rootObject = ["abc", { def: "test" }];
        const node = new Node((rootObject[1] as { def: string }).def, "def",
            new Node(rootObject[1], 1,
                new Node(rootObject, "", null)
            )
        );
        expect(node.buildPath()).toEqual([1, "def"]);
    });
});
