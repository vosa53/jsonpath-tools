import { PrimitiveDataType, PrimitiveDataTypeType, AnyDataType } from "../data-types/data-types";
import { IRegexp } from "../iregexp";
import { Type, FilterValue, isValueType, LogicalFalse, LogicalTrue } from "../values/types";
import { Function, FunctionContext } from "./function";

export const searchFunction: Function = {
    description: "Searches a text for a pattern.",
    parameters: [
        { name: "text", description: "The text to search.", type: Type.valueType, dataType: PrimitiveDataType.create(PrimitiveDataTypeType.string) },
        { name: "pattern", description: "The pattern to search.", type: Type.valueType, dataType: PrimitiveDataType.create(PrimitiveDataTypeType.string) }
    ],
    returnType: Type.logicalType,
    returnDataType: AnyDataType.create(),
    handler: (context: FunctionContext, text: FilterValue, pattern: FilterValue) => {
        if (!isValueType(text)) throw new Error();
        if (!isValueType(pattern)) throw new Error();
        if (typeof text !== "string" || typeof pattern !== "string") return LogicalFalse;

        try {
            const regex = IRegexp.convertToECMAScriptRegExp(pattern, false);
            return regex.test(text) ? LogicalTrue : LogicalFalse;
        }
        catch {
            context.reportParameterWarning(1, "Invalid I-Regexp pattern.");
            return LogicalFalse;
        }
    }
};
