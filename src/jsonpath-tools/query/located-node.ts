import { JSONPathJSONValue } from "../types";

export class LocatedNode {
    constructor(
        readonly value: JSONPathJSONValue,
        readonly pathSegment: string | number,
        readonly parent: LocatedNode | null
    ) { }
}