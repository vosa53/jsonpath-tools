import { countFunction } from "./functions/count";
import { Function } from "./functions/function";
import { lengthFunction } from "./functions/length";
import { matchFunction } from "./functions/match";
import { searchFunction } from "./functions/search";
import { valueFunction } from "./functions/value";

export interface QueryOptions {
    readonly functions: { [name: string]: Function };
}

export const defaultQueryOptions: QueryOptions = {
    functions: {
        "length": lengthFunction,
        "count": countFunction,
        "match": matchFunction,
        "search": searchFunction,
        "value": valueFunction
    }
};
