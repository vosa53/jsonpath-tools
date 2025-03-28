import { describe, it, expect } from "vitest";
import { countFunction, lengthFunction, matchFunction, searchFunction, valueFunction } from "./functions";
import { nullFunctionContext } from "./function";
import { LogicalFalse, LogicalTrue, Nothing } from "../values/types";
import { NodeList } from "../values/node-list";
import { Node } from "../values/node";

describe("Functions", () => {
    it("length - Empty string has length 0", () => {
        expect(lengthFunction.handler(nullFunctionContext, "")).toEqual(0);
    });

    it("length - Empty array has length 0", () => {
        expect(lengthFunction.handler(nullFunctionContext, [])).toEqual(0);
    });

    it("length - Empty object has length 0", () => {
        expect(lengthFunction.handler(nullFunctionContext, {})).toEqual(0);
    });

    it("length - Length of an string is a number of Unicode scalar values", () => {
        expect(lengthFunction.handler(nullFunctionContext, "abčď😎")).toEqual(5);
    });

    it("length - Length of an array is a number of elements", () => {
        expect(lengthFunction.handler(nullFunctionContext, [1, "test", ["abc"]])).toEqual(3);
    });

    it("length - Length of an object is a number of members", () => {
        expect(lengthFunction.handler(nullFunctionContext, { abc: "test", def: { test: 1, test2: false } })).toEqual(2);
    });

    it("length - Length of other value types is Nothing", () => {
        expect(lengthFunction.handler(nullFunctionContext, true)).toEqual(Nothing);
        expect(lengthFunction.handler(nullFunctionContext, false)).toEqual(Nothing);
        expect(lengthFunction.handler(nullFunctionContext, 123)).toEqual(Nothing);
        expect(lengthFunction.handler(nullFunctionContext, null)).toEqual(Nothing);
        expect(lengthFunction.handler(nullFunctionContext, Nothing)).toEqual(Nothing);
    });

    it("count - Empty nodelist has length 0", () => {
        expect(countFunction.handler(nullFunctionContext, NodeList.empty)).toEqual(0);
    });

    it("count - Returns number of nodes in node list", () => {
        const node1 = new Node("test", "", null);
        const node2 = new Node([1, 2], "", null);
        expect(countFunction.handler(nullFunctionContext, new NodeList([node1, node2]))).toEqual(2);
    });

    it("count - Nodes are NOT deduplicated", () => {
        const node = new Node("test", "", null);
        expect(countFunction.handler(nullFunctionContext, new NodeList([node, node]))).toEqual(2);
    });

    it("match - Checks whether the entirety of the given string matches an I-Regexp expression", () => {
        expect(matchFunction.handler(nullFunctionContext, "abc", "a[abd]c")).toEqual(LogicalTrue);
    });

    it("match - Submatch only is NOT sufficient", () => {
        expect(matchFunction.handler(nullFunctionContext, "abc", "ab")).toEqual(LogicalFalse);
    });

    it("match - Complex I-Regexp", () => {
        expect(matchFunction.handler(nullFunctionContext, "😎😎a12312123", "😎{2}[^.](12|123)+")).toEqual(LogicalTrue);
    });

    it("match - Invalid I-Regexp returns LogicalFalse", () => {
        expect(matchFunction.handler(nullFunctionContext, "a", "+")).toEqual(LogicalFalse);
    });

    it("match - Non-string value returns LogicalFalse", () => {
        expect(matchFunction.handler(nullFunctionContext, 123, "123")).toEqual(LogicalFalse);
        expect(matchFunction.handler(nullFunctionContext, true, "true")).toEqual(LogicalFalse);
        expect(matchFunction.handler(nullFunctionContext, {}, "true")).toEqual(LogicalFalse);
        expect(matchFunction.handler(nullFunctionContext, [], "true")).toEqual(LogicalFalse);
        expect(matchFunction.handler(nullFunctionContext, null, "null")).toEqual(LogicalFalse);
        expect(matchFunction.handler(nullFunctionContext, Nothing, "nothing")).toEqual(LogicalFalse);
    });

    it("search - Checks whether any substring of the given string matches an I-Regexp expression", () => {
        expect(searchFunction.handler(nullFunctionContext, "abcdef", "b.d")).toEqual(LogicalTrue);
    });

    it("search - Entire string match returns LogicalTrue", () => {
        expect(searchFunction.handler(nullFunctionContext, "abc", "abc")).toEqual(LogicalTrue);
    });

    it("search - Complex I-Regexp", () => {
        expect(searchFunction.handler(nullFunctionContext, "___😎😎a12312123_", "😎{2}[^.](12|123)+")).toEqual(LogicalTrue);
    });

    it("search - Invalid I-Regexp returns LogicalFalse", () => {
        expect(searchFunction.handler(nullFunctionContext, "a", "+")).toEqual(LogicalFalse);
    });

    it("search - Non-string value returns LogicalFalse", () => {
        expect(searchFunction.handler(nullFunctionContext, 123, "123")).toEqual(LogicalFalse);
        expect(searchFunction.handler(nullFunctionContext, true, "true")).toEqual(LogicalFalse);
        expect(searchFunction.handler(nullFunctionContext, {}, "true")).toEqual(LogicalFalse);
        expect(searchFunction.handler(nullFunctionContext, [], "true")).toEqual(LogicalFalse);
        expect(searchFunction.handler(nullFunctionContext, null, "null")).toEqual(LogicalFalse);
        expect(searchFunction.handler(nullFunctionContext, Nothing, "nothing")).toEqual(LogicalFalse);
    });

    it("value - Convert NodesType to ValueType", () => {
        const node = new Node(123, "", null);
        expect(valueFunction.handler(nullFunctionContext, new NodeList([node]))).toEqual(123);
    });

    it("value - Empty nodelist returns Nothing", () => {
        expect(valueFunction.handler(nullFunctionContext, NodeList.empty)).toEqual(Nothing);
    });

    it("value - Nodelist with more than 1 node returns Nothing", () => {
        const node = new Node(123, "", null);
        expect(valueFunction.handler(nullFunctionContext, new NodeList([node, node]))).toEqual(Nothing);
    });
});
