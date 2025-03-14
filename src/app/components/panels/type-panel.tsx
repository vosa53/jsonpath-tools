import { ActionIcon, Button, Group, Menu, Select } from "@mantine/core";
import { IconChevronDown, IconFileUpload } from "@tabler/icons-react";
import { memo } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";
import { DataTypeRaw, DataTypeRawFormat } from "@/app/models/data-type-raw";

const TypePanel = memo(({
    queryArgumentTypeRaw,
    onQueryArgumentTypeRawChanged
}: {
    queryArgumentTypeRaw: DataTypeRaw,
    onQueryArgumentTypeRawChanged: (queryArgumentTypeRaw: DataTypeRaw) => void
}) => {
    return (
        <PanelShell
            toolbar={
                <Group gap="xs" w="100%">
                    <Select
                        size="xs"
                        allowDeselect={false}
                        data={[
                            { label: "JSON Schema", value: DataTypeRawFormat.jsonSchema },
                            { label: "JSON Type Definition", value: DataTypeRawFormat.jsonTypeDefinition }
                        ]}
                        value={queryArgumentTypeRaw.format}
                        onChange={value => onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, format: value as DataTypeRawFormat })}
                    />
                    <ActionIcon variant="default" aria-label="Settings" ml="auto">
                        <IconFileUpload style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <Button variant="default" size="xs" rightSection={<IconChevronDown size={14} />}>Example Schema</Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item>Example 1</Menu.Item>
                            <Menu.Item>Example 2</Menu.Item>
                            <Menu.Item>Example 3</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            }
        >
            {
                queryArgumentTypeRaw.format === DataTypeRawFormat.jsonSchema
                    ? <JSONEditor value={queryArgumentTypeRaw.jsonSchemaText} onValueChanged={v => onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, jsonSchemaText: v })} />
                    : <JSONEditor value={queryArgumentTypeRaw.jsonTypeDefinitionText} onValueChanged={v => onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, jsonTypeDefinitionText: v })} />
            }
        </PanelShell>
    );
});
export default TypePanel;