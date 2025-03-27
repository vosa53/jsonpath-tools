import { Type } from "@/jsonpath-tools/values/types";

export interface CustomFunction {
    name: string;
    description: string;
    parameters: readonly CustomFunctionParameter[];
    returnType: Type;
    code: string;
}

export interface CustomFunctionParameter {
    name: string;
    description: string;
    type: Type;
}