import { describe, expect, it } from "vitest";
import { parseQueryAndPosition, testQueryOptions } from "../helpers/test-utils";
import { Tooltip, TooltipService } from "./tooltip-service";
import { TextRange } from "../text/text-range";
import { AnyDataType, DataType, DataTypeAnnotation, LiteralDataType, NeverDataType, ObjectDataType } from "../data-types/data-types";
import { JSONValue } from "../json/json-types";

describe("Tooltip service", () => {
    it("provideTooltip - Tooltip should have a correct range", () => {
        expect(provideTooltip(`$.a|bc.def`)!.range).toEqual(new TextRange(2, 3));
    });

    it("provideTooltip - Tooltip should contain a node type", () => {
        expect(provideTooltip(`$.a|bc.def`)!.text.toLowerCase()).toContain("name selector");
    });

    it("provideTooltip - Tooltip should contain a name selector name", () => {
        expect(provideTooltip(`$.a|bc.def`)!.text).toContain("abc");
    });

    it("provideTooltip - Tooltip should contain a name selector type for a concrete query argument", () => {
        expect(provideTooltip(`$.a|bc.def`, queryArgument)!.text).toContain("string");
    });

    it("provideTooltip - Tooltip should contain a name selector example for a concrete query argument", () => {
        expect(provideTooltip(`$.a|bc.def`, queryArgument)!.text).toContain("test");
    });

    it("provideTooltip - Tooltip should contain a name selector type for a type query argument", () => {
        expect(provideTooltip(`$.a|bc.def`, undefined, queryArgumentType)!.text).toContain("test");
    });

    it("provideTooltip - Tooltip should contain a name selector type annotation for a type query argument", () => {
        expect(provideTooltip(`$.a|bc.def`, undefined, queryArgumentType)!.text).toContain("Lorem impsum");
    });
});

const queryArgument = {
    abc: "test"
};

const queryArgumentType = ObjectDataType.create(new Map([
    ["abc", LiteralDataType.create("test", new Set([new DataTypeAnnotation("", "Lorem impsum", false, false, false, undefined, [])]))]
]), NeverDataType.create(), new Set());

function provideTooltip(queryText: string, queryArgument: JSONValue | undefined = undefined, queryArgumentType: DataType = AnyDataType.create()): Tooltip | null {
    const { query, position } = parseQueryAndPosition(queryText);
    const tooltipService = new TooltipService(testQueryOptions);
    const tooltip = tooltipService.provideTooltip(query, queryArgument, queryArgumentType, position);
    return tooltip;
}
