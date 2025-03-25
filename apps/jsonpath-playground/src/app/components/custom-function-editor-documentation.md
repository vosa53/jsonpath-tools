Code should be a JavaScript function body (*without* a function signature). Like this:
```javascript
return Math.sqrt(someArgument);
```

Parameters can be used directly by their names and result value should be returned from the function. 

### JSONPath values representation

`ValueType` values can be represented with their equivalent JavaScript constructs (e.g. JSON object corresponds to JavaScript object). Special value `JSONPathNothing` is represented with a symbol `jp.JSONPathNothing`. 

`LogicalType` values are represented by symbols `jp.JSONPathLogicalTrue` and `jp.JSONPathLogicalFalse`. 

`NodesType` values corresponds to a class `jp.JSONPathNodeList`.

### Error reporting

Function always needs to return some valid JSONPath value and should't throw errors, but users can be notified with a warning. Functions `context.reportWarning(message: string)` and `context.reportParameterWarning(parameterIndex: number, message: string)` are used for this purpose.

### Full API reference

Following symbols and classes are available to the function in a `jp` parameter, e.g.: `jp.JSONPathNodeList`. Current function context value is available in a parameter `context`.

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