import { AnyDataType } from "../data-types/data-types";
import { Type, FilterValue, isNodesType, Nothing } from "../values/types";
import { Function, FunctionContext } from "./function";

export const valueFunction: Function = {
    description: "Gets the value of a node.",
    parameters: [
        { name: "nodes", description: "The nodes to get the value of.", type: Type.nodesType, dataType: AnyDataType.create() }
    ],
    returnType: Type.valueType,
    returnDataType: AnyDataType.create(),
    handler: (context: FunctionContext, nodes: FilterValue) => {
        if (!isNodesType(nodes)) throw new Error();

        if (nodes.nodes.length === 1) return nodes.nodes[0].value;
        else return Nothing;
    }
};
