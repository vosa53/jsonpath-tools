import { Type } from "@jsonpath-tools/jsonpath";
import { Button, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { CustomFunction } from "../../models/custom-function";
import CustomFunctionEditor from "./custom-function-editor";
import CustomFunctionView from "./custom-function-view";

/**
 * Displays custom JSONPath functions.
 */
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

    const onEditedCustomFunctionSaved = (customFunction: CustomFunction) => {
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
                    onCustomFunctionSaved={onEditedCustomFunctionSaved}
                    onCancelled={close} />
            </Modal>
            <Button
                variant="outline"
                leftSection={<IconPlus size={14} />}
                onClick={() => {
                    setEditedCustomFunction(newCustomFunction);
                    setIsCreatingNew(true);
                    open();
                }}
            >
                Create New
            </Button>
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

const newCustomFunction: CustomFunction = {
    name: "",
    description: "",
    code: "",
    parameters: [],
    returnType: Type.valueType
};