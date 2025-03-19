import { JSONPathType } from "@/jsonpath-tools/options";
import { ActionIcon, Button, Collapse, Flex, Group, Input, Select, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconChevronUp, IconDeviceFloppy, IconHelp, IconPlus, IconTrash } from "@tabler/icons-react";
import { CustomFunction } from "../models/custom-function";
import JavaScriptEditor from "./code-editors/javascript-editor";
import MarkdownEditor from "./code-editors/markdown-editor";
import { EditorFormAdapter } from "./editor-form-adapter";

export default function CustomFunctionEditor({
    customFunction,
    existsName,
    onCustomFunctionChanged
}: {
    customFunction: CustomFunction,
    existsName: (name: string) => boolean,
    onCustomFunctionChanged: (value: CustomFunction) => void
}) {
    const form = useForm({
        mode: "uncontrolled",
        validateInputOnBlur: true,
        initialValues: {
            name: customFunction.name,
            description: customFunction.description,
            parameters: customFunction.parameters.map(p => ({
                name: p.name,
                description: p.description,
                type: p.type
            })),
            returnType: customFunction.returnType,
            code: customFunction.code,
        },
        validate: {
            name: (value) => validateName(value, existsName(value)),
            parameters: {
                name: (value, values) => validateName(value, count(values.parameters, p => p.name === value) > 1)
            }
        }
    });
    const onFormSubmit = (values: typeof form.values) => {
        onCustomFunctionChanged({
            name: values.name,
            description: values.description,
            parameters: values.parameters.map(p => ({
                name: p.name,
                description: p.description,
                type: p.type
            })),
            returnType: values.returnType,
            code: values.code
        });
    };
    const [documentationOpened, { toggle: documentationToggle }] = useDisclosure(false);

    const parameters = form.getValues().parameters.map((p, i) => (
        <Flex w="100%" align="center" gap="xs" key={i}>
            <Flex wrap="wrap" gap="xs" flex="1 1 0">
                <TextInput
                    flex="1 1 0"
                    label="Name"
                    key={form.key(`parameters.${i}.name`)}
                    {...form.getInputProps(`parameters.${i}.name`)} />
                <Select
                    label="Type"
                    allowDeselect={false}
                    data={[
                        { label: "ValueType", value: JSONPathType.valueType },
                        { label: "NodesType", value: JSONPathType.nodesType },
                        { label: "LogicalType", value: JSONPathType.logicalType }
                    ]}
                    key={form.key(`parameters.${i}.type`)}
                    {...form.getInputProps(`parameters.${i}.type`)}
                />
                <EditorFormAdapter
                    editor={(value, onValueChange) =>
                        <MarkdownEditor
                            value={value}
                            onValueChanged={onValueChange} />
                    }
                    style={{ width: "100%" }}
                    label="Description (Markdown)"
                    key={form.key(`parameters.${i}.description`)}
                    {...form.getInputProps(`parameters.${i}.description`)}
                />
            </Flex>
            <ActionIcon variant="subtle" color="red" size="input-sm" onClick={() => form.removeListItem("parameters", i)}>
                <IconTrash size={20} />
            </ActionIcon>
        </Flex>
    ));

    return (
        <form onSubmit={form.onSubmit(onFormSubmit)}>
            <Flex w="100%" wrap="wrap" gap="xs">
                <TextInput
                    flex="1 1 0"
                    label="Name"
                    key={form.key("name")}
                    {...form.getInputProps("name")} />
                <Select
                    label="Return Type"
                    allowDeselect={false}
                    data={[
                        { label: "ValueType", value: JSONPathType.valueType },
                        { label: "NodesType", value: JSONPathType.nodesType },
                        { label: "LogicalType", value: JSONPathType.logicalType }
                    ]}
                    key={form.key("returnType")}
                    {...form.getInputProps("returnType")}
                />
                <EditorFormAdapter
                    editor={(value, onValueChange) =>
                        <MarkdownEditor
                            value={value}
                            onValueChanged={onValueChange} />
                    }
                    style={{ width: "100%" }}
                    label="Description (Markdown)"
                    key={form.key("description")}
                    {...form.getInputProps("description")}
                />
            </Flex>
            <Stack mt="xs">
                <Input.Wrapper
                    label="Parameters"
                    w="100%">
                    <Stack align="start" pl="sm">
                        {parameters}
                        <Button
                            variant="subtle"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => form.insertListItem("parameters", { name: "", description: "", type: JSONPathType.valueType })}>
                            Add Parameter
                        </Button>
                    </Stack>
                </Input.Wrapper>
                <div>
                    <EditorFormAdapter
                        editor={(value, onValueChange) =>
                            <JavaScriptEditor
                                value={value}
                                onValueChanged={onValueChange} />
                        }
                        label="Code (JavaScript)"
                        key={form.key("code")}
                        {...form.getInputProps("code")}
                    />
                    <Button
                        variant="subtle"
                        leftSection={<IconHelp size={14} />}
                        rightSection={documentationOpened ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        size="xs"
                        style={{ alignSelf: "start" }}
                        onClick={documentationToggle}>
                        Documentation
                    </Button>
                    <Collapse in={documentationOpened}>
                        TODO...
                    </Collapse>
                </div>
                <Group justify="end">
                    <Button variant="default" type="button">Cancel</Button>
                    <Button type="submit" leftSection={<IconDeviceFloppy size={14} />}>Save</Button>
                </Group>
            </Stack>
        </form>
    );
}

function validateName(name: string, existsName: boolean): string | null {
    if (existsName) return "Name is not unique.";
    else if (name.trim() === "") return "Name can not be empty.";
    else if (!/^[a-z][a-z0-9_]*$/.test(name)) return "Name can contain only lowercase ASCII letters, digits, or underscores and it must start with a lower case ASCII letter.";
    else return null;
}

function count<T>(array: T[], predicate: (item: T) => boolean): number {
    let count = 0;
    for (const item of array)
        if (predicate(item)) count++;
    return count;
}