import { Operation, OperationType, ReplaceOperationReplacement } from "@/app/models/operation";
import { ActionIcon, Button, Group, Modal, Select, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconDeviceFloppy, IconFileDownload } from "@tabler/icons-react";
import { memo } from "react";
import JSONEditor from "../code-editors/json-editor";
import { EditorFormAdapter } from "../editor-form-adapter";
import PanelShell from "../panel-shell";
import { saveTextFile } from "@/app/services/files";

const ResultPanel = memo(({
    resultText,
    operation,
    onOperationChanged
}: {
    resultText: string,
    operation: Operation,
    onOperationChanged: (operation: Operation) => void
}) => {
    const [modalOpened, { open, close }] = useDisclosure(false);

    const onReplacementSaved = (replacement: ReplaceOperationReplacement) => {
        onOperationChanged({ ...operation, replacement });
        close();
    };

    return (
        <PanelShell
            toolbar={
                <Group gap="xs" w="100%">
                    <Modal opened={modalOpened} onClose={close} title={"Edit replacement value"} size="xl">
                        <ReplacementEditor
                            replacement={operation.replacement}
                            onReplacementSaved={onReplacementSaved} 
                            onCancelled={close} />
                    </Modal>
                    <Select
                        size="xs"
                        allowDeselect={false}
                        data={[
                            { label: "Select", value: OperationType.select },
                            { label: "Replace", value: OperationType.replace },
                            { label: "Delete", value: OperationType.delete }
                        ]}
                        value={operation.type}
                        onChange={value => onOperationChanged({ ...operation, type: value as OperationType })}
                    />
                    {
                        operation.type === OperationType.replace &&
                        <Button
                            variant="subtle" size="compact-sm" onClick={() => open()}>Edit Replacement</Button>
                    }
                    <ActionIcon variant="default" aria-label="Settings" ml="auto" onClick={async () => await saveTextFile("result.json", "application/json", ".json", resultText)}>
                        <IconFileDownload style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                </Group>
            }
        >
            <JSONEditor value={resultText} readonly onValueChanged={() => { }} />
        </PanelShell>
    );
});
export default ResultPanel;

function ReplacementEditor({
    replacement,
    onReplacementSaved,
    onCancelled
}: {
    replacement: ReplaceOperationReplacement,
    onReplacementSaved: (replacement: ReplaceOperationReplacement) => void,
    onCancelled: () => void
}) {
    const form = useForm({
        mode: "uncontrolled",
        validateInputOnBlur: true,
        initialValues: {
            replacementText: replacement.replacementText
        },
        validate: {
            replacementText: (value) => validateJSONString(value)
        }
    });
    const onFormSubmit = (values: typeof form.values) => {
        onReplacementSaved({
            replacement: JSON.parse(values.replacementText),
            replacementText: values.replacementText
        });
    };

    return (
        <form onSubmit={form.onSubmit(onFormSubmit)}>
            <Stack>
                <EditorFormAdapter
                    editor={(value, onValueChange, onFocus, onBlur) =>
                        <JSONEditor
                            value={value}
                            onValueChanged={onValueChange}
                            onFocus={onFocus}
                            onBlur={onBlur} />
                    }
                    style={{ width: "100%" }}
                    label="Replacement JSON"
                    key={form.key("replacementText")}
                    {...form.getInputProps("replacementText")}
                />
                <Group justify="end">
                    <Button variant="default" type="button" onClick={onCancelled}>Cancel</Button>
                    <Button type="submit" leftSection={<IconDeviceFloppy size={14} />}>Save</Button>
                </Group>
            </Stack>
        </form>
    );
}

function validateJSONString(value: string): string | null {
    try {
        JSON.parse(value);
        return null;
    }
    catch (e) {
        return "Invalid JSON: " + e;
    }
}