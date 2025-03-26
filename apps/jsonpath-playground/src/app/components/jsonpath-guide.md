JSONPath ([RFC 9535](https://datatracker.ietf.org/doc/rfc9535/)) is a simple query language to extract values from a JSON document.

A query is a sequence of *segments* that consists of *selectors* to select or filter values from objects/arrays. The character `$` represents the query argument and every query has to start with it.

### Name Selector

The most simple is a *name selector*, which selects a value from the object property:

```jsonpath
$.dealership.location
```
Which is a shorthand syntax for:
```jsonpath
$["dealership"]["location"]
```

### Index Selector

Similarly, an *index selector* is used for arrays:
```jsonpath
$.dealership.inventory[2]
```

Arrays are indexed **from zero**. It is also possible to index from end, negative indices are used for this:
```jsonpath
$.dealership.inventory[-1]
```
The previous query selects the **last** item from the inventory (at `length - 1`).

### Wildcard Selector

A *wildcard selector* `*` can be used to select all values from an object/array:
```jsonpath
$.dealership.inventory[*]
```
Or alternatively:
```jsonpath
$.dealership.inventory.*
```

### Slice selector
To select a range of elements from an array, the *slice selector* is available. Its parameters are start index (inclusive), end index (exclusive), and step. It uses the syntax: `start:end:step`. Each of these parameters can be omitted, in which case a default value is used.

For the following examples suppose 5 elements.

Selects elements at `2`, `3`:
```jsonpath
$.dealership.inventory[2:4]
```

Selects the first 3 elements (`0`, `1`, `2`):
```jsonpath
$.dealership.inventory[:3]
```

Selects elements at `1`, `3`:
```jsonpath
$.dealership.inventory[1:5:2]
```

Selects every second element (`0`, `2`, `4`):
```jsonpath
$.dealership.inventory[::2]
```

Selects all elements (`0`, `1`, `2`, `3`, `4`):
```jsonpath
$.dealership.inventory[:]
```
The previous query can be used as an alternative to `*`, but only for arrays.

Negative values are also allowed for all parameters. For example, the following query selects all elements, but in the **reverse order** (`4`, `3`, `2`, `1`, `0`):
```jsonpath
$.dealership.inventory[::-1]
```

### Filter Selector
The most powerful is a *filter selector*. It allows to select array/object values based on a boolean condition with nested queries. It is preceded by `?` character. The current filtered element in the expression is represented with a `@` character.

A simple filter can look like this:
```jsonpath
$.dealership.inventory[?@.make == "Ford"]
```
It selects all values where `make` property is equal to `Ford`.

#### Comparison operators

All available comparison operators are summarized in this table:
| Operator | Description           |
|----------|-----------------------|
| ==       | Equal                 |
| !=       | Not equal             |
| <        | Lower than            |
| >        | Greater than          |
| <=       | Lower than or equal   |
| >=       | Greater than or equal |

#### Existence test

If no operator is used, the nested query is considered an existence test. Empty subquery result means `LogicalFalse` and not empty `LogicalTrue`.

For example, the following example selects all cars that have Bluetooth between their features:
```jsonpath
$.dealership.inventory[?@.features[?@ == "Bluetooth"]]
```

#### Logical operators

Logical expressions can be combined with the following operators:
| Operator | Description                     |
|----------|---------------------------------|
| &&       | Logical AND (all true)          |
| \|\|     | Logical OR (some true)          |
| !        | Logical NOT (not true)          |

Operator `&&` has higher precedence than `||`. It is also possible to use parenthesis `(` and `)` to change the precedences.

#### Functions

Filter expressions can also use *functions*. These functions use a simple type system with the following types:

- `ValueType`: JSON value (object, array, number, ...) or a special value `Nothing`.
- `LogicalType`: Represents logical expression values, either `LogicalTrue` or `LogicalFalse`. **Note: These values are distinct from the JSON values `true` and `false`.**
- `NodesType`: List of JSON values. Represents a result of a query.

A type `NodesType` can be implicitly converted to `LogicalType` (similar to the previously mentioned existence test).

There are 5 built-in functions:
- `length(): ValueType`
- `count(): ValueType`
- `match(): LogicalType`
- `search(): LogicalType`
- `value(): ValueType`

#### I-Regexp - Regular expressions

To ensure interoperability between programming languages, JSONPath filter functions use a simplified, standardized subset of common regular expressions called *I-Regexp* ([RFC 9485](https://datatracker.ietf.org/doc/rfc9485/)).

I-Regexp supports the following patterns:

It lacks more advanced features like lookahead or capture groups.

### Multiple selectors

A single segment (represented with a `[` and `]`) can contain multiple selectors. For example, the following query selects the first employee and also the one with the name `Mike Johnson`.

```jsonpath
$.dealership.employees[0, ?@.name == "Mike Johnson"]
```

A value can also be selected multiple times.

### Descendant segments

JSONPath segments are actually of two types: *child segment* and *descendant segment*. The ones shown so far were child segments because they operated only on the value itself. Descendant selectors operate on the value and also on all its descendants.

The descendant segment uses a syntax of two dots `..`.

For example, the following query selects the property `id` from every object in the document:

```jsonpath
$..id
```

Equivalent to a longer form:
```jsonpath
$..["id"]
```

### Query result

TODO...