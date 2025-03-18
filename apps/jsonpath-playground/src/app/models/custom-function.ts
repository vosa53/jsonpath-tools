import { JSONPathType } from "@/jsonpath-tools/options";

export interface CustomFunction {
    name: string;
    description: string;
    parameters: readonly CustomFunctionParameter[];
    returnType: JSONPathType;
    code: string;
}

export interface CustomFunctionParameter {
    name: string;
    description: string;
    type: JSONPathType;
}