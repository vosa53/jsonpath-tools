import { useState } from "react";
import JSONPathEditor from "../lib/jsonpath-editor";
import { AnyDataType, defaultQueryOptions } from "@jsonpath-tools/jsonpath";

export default function Root() {
    const [value, setValue] = useState("");
    return (
        <JSONPathEditor value={value} onValueChanged={setValue} options={defaultQueryOptions} queryArgumentType={AnyDataType.create()} queryArgument={{}} />
    );
}