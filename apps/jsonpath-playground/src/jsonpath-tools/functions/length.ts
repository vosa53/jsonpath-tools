import { UnionDataType, PrimitiveDataType, PrimitiveDataTypeType, ObjectDataType, AnyDataType, ArrayDataType } from "../data-types/data-types";
import { Type, FilterValue, isValueType, Nothing } from "../values/types";
import { Function, FunctionContext } from "./function";

export const lengthFunction: Function = {
    description: "Gets the length of a value.",
    parameters: [
        { name: "value", description: "The value to get the length of.", type: Type.valueType, dataType: UnionDataType.create([PrimitiveDataType.create(PrimitiveDataTypeType.string), ObjectDataType.create(new Map(), AnyDataType.create(), new Set()), ArrayDataType.create([], AnyDataType.create(), 0)]) }
    ],
    returnType: Type.valueType,
    returnDataType: UnionDataType.create([PrimitiveDataType.create(PrimitiveDataTypeType.number), PrimitiveDataType.create(PrimitiveDataTypeType.nothing)]),
    handler: (context: FunctionContext, value: FilterValue) => {
        if (!isValueType(value)) throw new Error();

        if (typeof value === "string") return [...value].length;
        else if (Array.isArray(value)) return value.length;
        else if (typeof value === "object" && value !== null) return Object.keys(value).length;
        else return Nothing;
    }
};
