import { Operation, OperationType, OperationReplacement, OperationReplacementType } from "@/app/models/operation";
import { ActionIcon, Button, Group, InputWrapper, Modal, SegmentedControl, Select, Stack, Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconDeviceFloppy, IconFileDownload } from "@tabler/icons-react";
import { memo, useState } from "react";
import JSONEditor from "../code-editors/json-editor";
import { EditorFormAdapter } from "../editor-form-adapter";
import PanelShell from "../panel-shell";
import { saveTextFile } from "@/app/services/files";
import { isJSONString } from "@/app/validators/is-json-string";
import { isJSONPatchString } from "@/app/validators/is-json-patch-string";

/**
 * Panel displaying JSONPath query result values.
 */
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

    const onReplacementSaved = (replacement: OperationReplacement) => {
        onOperationChanged({ ...operation, replacement });
        close();
    };

    return (
        <PanelShell
            toolbar={
                <Group gap="xs" w="100%">
                    <Modal opened={modalOpened} onClose={close} title={"Edit Replacement"} size="xl">
                        <ReplacementEditor
                            replacement={operation.replacement}
                            onReplacementSaved={onReplacementSaved}
                            onCancelled={close} />
                    </Modal>
                    <Tooltip label="Operation">
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
                    </Tooltip>
                    {
                        operation.type === OperationType.replace &&
                        <Button
                            variant="subtle" size="compact-sm" onClick={() => open()}>Edit Replacement</Button>
                    }
                    <Tooltip label="Save To a File">
                        <ActionIcon variant="default" aria-label="Save To a File" ml="auto" onClick={async () => await saveTextFile("result.json", "application/json", ".json", resultText)}>
                            <IconFileDownload style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
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
    replacement: OperationReplacement,
    onReplacementSaved: (replacement: OperationReplacement) => void,
    onCancelled: () => void
}) {
    const form = useForm({
        mode: "uncontrolled",
        validateInputOnBlur: true,
        initialValues: {
            type: replacement.type,
            jsonValueText: replacement.jsonValueText,
            jsonPatchText: replacement.jsonPatchText
        },
        validate: {
            jsonValueText: (value, values) => values.type === OperationReplacementType.jsonValue ? isJSONString(value) : null,
            jsonPatchText: (value, values) => values.type === OperationReplacementType.jsonPatch ? isJSONPatchString(value) : null
        }
    });
    const onFormSubmit = (values: typeof form.values) => {
        onReplacementSaved({
            type: values.type,
            jsonValueText: values.jsonValueText,
            jsonPatchText: values.jsonPatchText
        });
    };
    const [type, setType] = useState(replacement.type);
    form.watch("type", ({ value }) => setType(value));

    return (
        <form onSubmit={form.onSubmit(onFormSubmit)}>
            <Stack>
                <InputWrapper label="Type">
                    <div>
                        <SegmentedControl
                            color="violet"
                            key={form.key("type")}
                            {...form.getInputProps("type")}
                            data={[
                                { label: "JSON Value", value: OperationReplacementType.jsonValue },
                                { label: "JSON Patch", value: OperationReplacementType.jsonPatch }
                            ]}
                        />
                    </div>
                </InputWrapper>
                {
                    type === OperationReplacementType.jsonValue &&
                    <EditorFormAdapter
                        editor={(value, onValueChange, onFocus, onBlur) =>
                            <JSONEditor
                                value={value}
                                onValueChanged={onValueChange}
                                onFocus={onFocus}
                                onBlur={onBlur} />
                        }
                        label="JSON Value"
                        description="JSON value that will be used to replace the result nodes in the input JSON."
                        key={form.key("jsonValueText")}
                        {...form.getInputProps("jsonValueText")}
                    />
                }
                {
                    type === OperationReplacementType.jsonPatch &&
                    <EditorFormAdapter
                        editor={(value, onValueChange, onFocus, onBlur) =>
                            <JSONEditor
                                value={value}
                                onValueChanged={onValueChange}
                                onFocus={onFocus}
                                onBlur={onBlur} />
                        }
                        label="JSON Patch"
                        description={
                            <>
                                JSON Patch (<a href="https://datatracker.ietf.org/doc/html/rfc6902" target="_blank">RFC 6902</a>) document that will be applied to every result node in the input JSON (post-order, i.e. descendants first).
                            </>
                        }
                        key={form.key("jsonPatchText")}
                        {...form.getInputProps("jsonPatchText")}
                    />
                }
                <Group justify="end">
                    <Button variant="default" type="button" onClick={onCancelled}>Cancel</Button>
                    <Button type="submit" leftSection={<IconDeviceFloppy size={14} />}>Save</Button>
                </Group>
            </Stack>
        </form>
    );
}
