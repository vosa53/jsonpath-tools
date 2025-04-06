import { Type } from "@/jsonpath-tools/values/types";

/**
 * Custom JSONPath function.
 */
export interface CustomFunction {
    /**
     * Name.
     */
    name: string;

    /**
     * Description. In Markdown format.
     */
    description: string;

    /**
     * List of function parameters.
     */
    parameters: readonly CustomFunctionParameter[];
    
    /**
     * Return type.
     */
    returnType: Type;

    /**
     * JavaScript code of the function implementation.
     */
    code: string;
}

/**
 * Parameter of a custom JSONPath function.
 */
export interface CustomFunctionParameter {
    /**
     * Name.
     */
    name: string;

    /**
     * Description. In Markdown format.
     */
    description: string;

    /**
     * Type.
     */
    type: Type;
}