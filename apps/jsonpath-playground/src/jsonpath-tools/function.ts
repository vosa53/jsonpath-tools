import { DataType } from "./data-types/data-types";
import { Type, FilterValue } from "./values/types";

export interface Function {
    readonly description: string;
    readonly parameters: readonly FunctionParameter[];
    readonly returnType: Type;
    readonly returnDataType: DataType;
    readonly handler: FunctionHandler;
}

export interface FunctionParameter {
    readonly name: string;
    readonly description: string;
    readonly type: Type;
    readonly dataType: DataType;
}

export type FunctionHandler = (context: FunctionContext, ...args: FilterValue[]) => FilterValue;

export interface FunctionContext {
    reportWarning(message: string): void;
    reportParameterWarning(parameterIndex: number, message: string): void;
}
