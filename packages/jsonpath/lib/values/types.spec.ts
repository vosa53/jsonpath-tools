import { describe, it, expect } from "vitest";
import { isLogicalType, isNodesType, isValueType, LogicalFalse, LogicalTrue, Nothing } from "./types";
import { NodeList } from "./node-list";

describe("Types", () => {
    it("isValueType - Is a value type", () => {
        expect(isValueType("test")).toBeTruthy();
        expect(isValueType(123)).toBeTruthy();
        expect(isValueType(false)).toBeTruthy();
        expect(isValueType(null)).toBeTruthy();
        expect(isValueType({ a: "b" })).toBeTruthy();
        expect(isValueType([1, "2"])).toBeTruthy();
        expect(isValueType(Nothing)).toBeTruthy();
    });

    it("isValueType - Is NOT a value type", () => {
        expect(isValueType(NodeList.empty)).toBeFalsy();
        expect(isValueType(LogicalFalse)).toBeFalsy();
        expect(isValueType(LogicalTrue)).toBeFalsy();
    });

    it("isLogicalType - Is a logical type", () => {
        expect(isLogicalType(LogicalFalse)).toBeTruthy();
        expect(isLogicalType(LogicalTrue)).toBeTruthy();
    });

    it("isLogicalType - Is NOT a logical type", () => {
        expect(isLogicalType("test")).toBeFalsy();
        expect(isLogicalType(123)).toBeFalsy();
        expect(isLogicalType(false)).toBeFalsy();
        expect(isLogicalType(null)).toBeFalsy();
        expect(isLogicalType({ a: "b" })).toBeFalsy();
        expect(isLogicalType([1, "2"])).toBeFalsy();
        expect(isLogicalType(Nothing)).toBeFalsy();
        expect(isLogicalType(NodeList.empty)).toBeFalsy();
    });

    it("isNodesType - Is a nodes type", () => {
        expect(isNodesType(NodeList.empty)).toBeTruthy();
    });

    it("isNodesType - Is NOT a nodes type", () => {
        expect(isNodesType("test")).toBeFalsy();
        expect(isNodesType(123)).toBeFalsy();
        expect(isNodesType(false)).toBeFalsy();
        expect(isNodesType(null)).toBeFalsy();
        expect(isNodesType({ a: "b" })).toBeFalsy();
        expect(isNodesType([1, "2"])).toBeFalsy();
        expect(isNodesType(Nothing)).toBeFalsy();
        expect(isNodesType(LogicalFalse)).toBeFalsy();
        expect(isNodesType(LogicalTrue)).toBeFalsy();
    });
});
