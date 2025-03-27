The code should be a JavaScript function body (*without* a function signature). Like this:
```javascript
return Math.sqrt(someArgument);
```

Parameters can be used directly by their names, and the result value should be returned from the function. 

### JSONPath values representation

`ValueType` values can be represented with their equivalent JavaScript constructs (e.g. JSON object corresponds to JavaScript object). Special value `Nothing` is represented with a symbol `jp.Nothing`. 

`LogicalType` values are represented by symbols `jp.LogicalTrue` and `jp.LogicalFalse`. 

`NodesType` values correspond to the class `jp.NodeList`.

### Error reporting

The function always needs to return some valid JSONPath value and shouldn't throw errors, but users can be notified with a warning. Functions `context.reportWarning(message: string)` and `context.reportParameterWarning(parameterIndex: number, message: string)` are used for this purpose.

### Full API reference

The following symbols and classes are available to the function via the `jp` parameter, e.g.: `jp.NodeList`. The function current context value is available via the `context` parameter.

```typescript
interface FunctionContext {
    reportWarning(message: string): void;
    reportParameterWarning(parameterIndex: number, message: string): void;
}

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
const Nothing: unique symbol;

const LogicalTrue: unique symbol;
const LogicalFalse: unique symbol;

class NodeList {
    constructor(
        readonly nodes: readonly Node[]
    );
}

class Node {
    constructor(
        readonly value: JSONValue,
        readonly pathSegment: NormalizedPathSegment,
        readonly parent: Node | null
    );
    buildPath(): NormalizedPath;
}

type NormalizedPath = readonly NormalizedPathSegment[];
type NormalizedPathSegment = string | number;

type ValueType = JSONValue | typeof JSONPathNothing;
type LogicalType = typeof JSONPathLogicalTrue | typeof JSONPathLogicalFalse;
type NodesType = NodeList;
```