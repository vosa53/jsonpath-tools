JSONPath Playground is an application for creating JSONPath queries according to the standard [RFC 9535](https://datatracker.ietf.org/doc/rfc9535/). The application also allows to use these queries to find values in a JSON, or to replace them with some other value, modify them using JSON Patch or delete them. It also allows to define custom JSONPath functions using JavaScript code. 

### JSONPath Editor

JSONPath editor offers these features:

- Syntax highlighting
- Diagnostics (errors and warnings)
    - Syntax
    - Data types
    - Unknown names
- Autocomplete
    - Syntax
    - Properties/indices
    - Values
- Function signature help (parameters)
- Hover tooltips
    - Syntax explanation
    - Function documentation
    - Schema annotations (description, examples, default value, ...)
    - Value examples
    - Data types
- Automatic indentation
- Folding
- Document symbols highlighting
- Formatting

Editor can work with concrete JSON data and/or with JSON Schema (or JSON Type definition).

**It actually works in two modes**: If concrete data are provided, it can be more precise and shows completions, types, examples, ... directly from the data. Schema is then used mostly only for documentation. But if the concrete data are invalid or missing, it uses only schema. Which has also its own advantages, for example, it allows to be more general and write a query for multiple uses only according to a general data shape.

#### Specific Editor Shortcuts

- `Ctrl+Enter`: Execute query.
- `Ctrl+Space`: Trigger completion.
- `Ctrl+Shift+Space`: Trigger signature help.
- `Alt+Shift+F`: Format query.

### Custom Functions

Custom JSONPath functions can be created using the JavaScript programming language. The API documentation is available under its code editor.