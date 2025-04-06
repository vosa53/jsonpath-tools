import { DataType } from "../data-types/data-types";
import { Type, FilterValue } from "../values/types";

/**
 * JSONPath function.
 */
export interface Function {
    /**
     * Description. In Markdown format.
     */
    readonly description: string;

    /**
     * List of function parameters.
     */
    readonly parameters: readonly FunctionParameter[];

    /**
     * Return type.
     */
    readonly returnType: Type;

    /**
     * Return data type.
     */
    readonly returnDataType: DataType;

    /**
     * Handler that executes the function.
     */
    readonly handler: FunctionHandler;
}

export interface FunctionParameter {
    /**
     * Name.
     */
    readonly name: string;

    /**
     * Description. In Markdown format.
     */
    readonly description: string;

    /**
     * Type.
     */
    readonly type: Type;

    /**
     * Data type.
     */
    readonly dataType: DataType;
}

export type FunctionHandler = (context: FunctionContext, ...args: FilterValue[]) => FilterValue;

/**
 * Context of a function execution.
 */
export interface FunctionContext {
    /**
     * Reports a warning related to the function itself.
     * @param message Warning message.
     */
    reportWarning(message: string): void;

    /**
     * Reports a warning related to the function parameter.
     * @param parameterIndex Index of the parameter in the function parameters list.
     * @param message Warning message.
     */
    reportParameterWarning(parameterIndex: number, message: string): void;
}

/**
 * {@link FunctionContext} that does nothing.
 */
export const nullFunctionContext: FunctionContext = {
    reportParameterWarning(parameterIndex, message) { },
    reportWarning(message) { }
};
