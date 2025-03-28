import { AnyDataType, PrimitiveDataType, PrimitiveDataTypeType } from "../data-types/data-types";
import { Type, FilterValue, isNodesType } from "../values/types";
import { Function, FunctionContext } from "./function";

export const countFunction: Function = {
    description: "Counts the number of nodes.",
    parameters: [
        { name: "nodes", description: "The nodes to count.", type: Type.nodesType, dataType: AnyDataType.create() }
    ],
    returnType: Type.valueType,
    returnDataType: PrimitiveDataType.create(PrimitiveDataTypeType.number),
    handler: (context: FunctionContext, nodes: FilterValue) => {
        if (!isNodesType(nodes)) throw new Error();

        return nodes.nodes.length;
    }
};
