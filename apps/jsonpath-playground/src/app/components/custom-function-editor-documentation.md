The code should be a JavaScript function body (*without* a function signature). Like this:
```javascript
return Math.sqrt(someArgument);
```

Parameters can be used directly by their names, and the result value should be returned from the function. 

### JSONPath values representation

`ValueType` values can be represented with their equivalent JavaScript constructs (e.g. JSON object corresponds to JavaScript object). Special value `JSONPathNothing` is represented with a symbol `jp.JSONPathNothing`. 

`LogicalType` values are represented by symbols `jp.JSONPathLogicalTrue` and `jp.JSONPathLogicalFalse`. 

`NodesType` values correspond to the class `jp.JSONPathNodeList`.

### Error reporting

The function always needs to return some valid JSONPath value and shouldn't throw errors, but users can be notified with a warning. Functions `context.reportWarning(message: string)` and `context.reportParameterWarning(parameterIndex: number, message: string)` are used for this purpose.

### Full API reference

The following symbols and classes are available to the function via the `jp` parameter, e.g.: `jp.JSONPathNodeList`. The function current context value is available via the `context` parameter.

```typescript
interface JSONPathFunctionContext {
    reportWarning(message: string): void;
    reportParameterWarning(parameterIndex: number, message: string): void;
}

type JSONPathJSONValue = string | number | boolean | null | JSONPathJSONValue[] | { [key: string]: JSONPathJSONValue };
const JSONPathNothing: unique symbol;

const JSONPathLogicalTrue: unique symbol;
const JSONPathLogicalFalse: unique symbol;

class JSONPathNodeList {
    constructor(
        readonly nodes: readonly LocatedNode[]
    );
}

class LocatedNode {
    constructor(
        readonly value: JSONPathJSONValue,
        readonly pathSegment: string | number,
        readonly parent: LocatedNode | null
    );
    buildPath(): (string | number)[];
}

type JSONPathValueType = JSONPathJSONValue | typeof JSONPathNothing;
type JSONPathLogicalType = typeof JSONPathLogicalTrue | typeof JSONPathLogicalFalse;
type JSONPathNodesType = JSONPathNodeList;
```