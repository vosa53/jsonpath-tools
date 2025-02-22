import { CustomFunction } from "../models/custom-function";
import { useDisclosure } from "@mantine/hooks";
import { Button, Modal } from "@mantine/core";
import { useRef, useState } from "react";
import CustomFunctionEditor from "./custom-function-editor";
import CustomFunctionView from "./custom-function-view";

const newCustomFunction: CustomFunction = {
    name: "",
    description: "",
    code: "TODO"
};

export default function CustomFunctionsView({
    customFunctions,
    onCustomFunctionsChanged
}: {
    customFunctions: readonly CustomFunction[],
    onCustomFunctionsChanged: (value: readonly CustomFunction[]) => void
}) {
    const [opened, { open, close }] = useDisclosure(false);
    const editedCustomFunctionRef = useRef<CustomFunction | null>(null);
    const [editedCustomFunction, setEditedCustomFunction] = useState<CustomFunction>(newCustomFunction);

    const onSaveClick = () => {
        const newCustomFunctions = [...customFunctions];
        if (editedCustomFunctionRef.current === null)
            newCustomFunctions.push(editedCustomFunction);
        else
            newCustomFunctions[customFunctions.indexOf(editedCustomFunctionRef.current)] = editedCustomFunction;
        onCustomFunctionsChanged(newCustomFunctions);
        close();
    };

    return (
        <div>
            <Modal opened={opened} onClose={close} title={editedCustomFunctionRef.current === null ? "Add Custom Function" : "Edit Custom Function"} size="xl">
                <CustomFunctionEditor customFunction={editedCustomFunction} onCustomFunctionChanged={setEditedCustomFunction} />
                <Button onClick={onSaveClick}>Save</Button>
            </Modal>
            {customFunctions.map((cf, i) => (
                <CustomFunctionView
                    key={i}
                    customFunction={cf}
                    onEditClick={() => {
                        editedCustomFunctionRef.current = cf;
                        setEditedCustomFunction(cf);
                        open();
                    }}
                />
            ))}
            <Button
                variant="default"
                onClick={() => {
                    editedCustomFunctionRef.current = null;
                    setEditedCustomFunction(newCustomFunction);
                    open();
                }}
            >Add</Button>
        </div>
    );
}
