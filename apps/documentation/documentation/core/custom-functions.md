# Custom Functions

Custom JSONPath functions can be created and passed to the library. For example:

```ts
import { 
    defaultQueryOptions, FilterValue, FunctionContext, Nothing, 
    PrimitiveDataType, PrimitiveDataTypeType, QueryOptions, Type 
} 
from "@jsonpath-tools/jsonpath";

const customQueryOptions: QueryOptions = {
    ...defaultQueryOptions,
    functions: {
        ...defaultQueryOptions.functions,
        sqrt: {
            description: "Calculates a square root of the given number.",
            parameters: [
                { 
                    name: "value", 
                    description: "A *non-negative* number.", 
                    type: Type.valueType, 
                    dataType: PrimitiveDataType.create(PrimitiveDataTypeType.number) 
                }
            ],
            returnType: Type.valueType,
            returnDataType: PrimitiveDataType.create(PrimitiveDataTypeType.number),
            handler: (context: FunctionContext, value: FilterValue) => {
                if (typeof value !== "number" || value < 0) {
                    context.reportParameterWarning(0, "Expected a non-negative number.");
                    return Nothing;
                }
                return Math.sqrt(value);
            }
        }
    }
};
```

It can be used in a query like this:
```ts
const nodes = JSONPath.select(`$[?sqrt(@.area) > 5]`, queryArgument, customQueryOptions);
```