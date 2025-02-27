import { CustomFunction } from "../models/custom-function";
import { useDisclosure } from "@mantine/hooks";
import { Button, Modal } from "@mantine/core";
import { useRef, useState } from "react";
import CustomFunctionEditor from "./custom-function-editor";
import CustomFunctionView from "./custom-function-view";
import { JSONPathType } from "@/jsonpath-tools/options";
import { IconPlus } from "@tabler/icons-react";

const newCustomFunction: CustomFunction = {
    name: "",
    description: "",
    code: "TODO",
    parameters: [],
    returnType: JSONPathType.valueType
};

export default function CustomFunctionsView({
    customFunctions,
    onCustomFunctionsChanged
}: {
    customFunctions: readonly CustomFunction[],
    onCustomFunctionsChanged: (value: readonly CustomFunction[]) => void
}) {
    const [opened, { open, close }] = useDisclosure(false);
    const [editedCustomFunction, setEditedCustomFunction] = useState<CustomFunction>(newCustomFunction);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    const onEditedCustomFunctionChanged = (customFunction: CustomFunction) => {
        const newCustomFunctions = [...customFunctions];
        if (isCreatingNew)
            newCustomFunctions.push(customFunction);
        else
            newCustomFunctions[customFunctions.indexOf(editedCustomFunction)] = customFunction;
        onCustomFunctionsChanged(newCustomFunctions);
        close();
    };

    return (
        <div>
            <Modal opened={opened} onClose={close} title={isCreatingNew ? "Create Custom Function" : "Edit Custom Function"} size="xl">
                <CustomFunctionEditor
                    customFunction={editedCustomFunction}
                    existsName={(name) => customFunctions.some(cf => cf.name === name && cf !== editedCustomFunction)}
                    onCustomFunctionChanged={onEditedCustomFunctionChanged} />
            </Modal>
            <Button
                variant="outline"
                leftSection={<IconPlus size={14} />}
                onClick={() => {
                    setEditedCustomFunction(newCustomFunction);
                    setIsCreatingNew(true);
                    open();
                }}
            >Create New</Button>
            {customFunctions.map((cf, i) => (
                <CustomFunctionView
                    key={i}
                    customFunction={cf}
                    onEditClick={() => {
                        setEditedCustomFunction(cf);
                        setIsCreatingNew(false);
                        open();
                    }}
                />
            ))}
        </div>
    );
}
