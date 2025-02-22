import { CustomFunction } from "../models/custom-function";
import JavaScriptEditor from "./code-editors/javascript-editor";
import { Input, TextInput } from "@mantine/core";

export default function CustomFunctionEditor({
    customFunction,
    onCustomFunctionChanged
}: {
    customFunction: CustomFunction,
    onCustomFunctionChanged: (value: CustomFunction) => void
}) {
    return (
        <>
            <TextInput label="Name" value={customFunction.name} onChange={e => onCustomFunctionChanged({ ...customFunction, name: e.currentTarget.value })} />
            <TextInput label="Description" value={customFunction.description} onChange={e => onCustomFunctionChanged({ ...customFunction, description: e.currentTarget.value })} />
            <Input.Wrapper label="JavaScript Code">
                <JavaScriptEditor value={customFunction.code} onValueChanged={code => onCustomFunctionChanged({ ...customFunction, code })} />
            </Input.Wrapper>
        </>
    );
}
