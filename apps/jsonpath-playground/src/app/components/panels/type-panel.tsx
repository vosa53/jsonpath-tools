import { ActionIcon, Button, Group, Menu, Select, Tooltip } from "@mantine/core";
import { IconChevronDown, IconFileUpload } from "@tabler/icons-react";
import { memo } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";
import { DataTypeRaw, DataTypeRawFormat } from "../../models/data-type-raw";
import { examples } from "../../models/examples";
import { openTextFile } from "../../services/files";

/**
 * Panel for query argument type editation.
 */
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
                    <Tooltip label="Schema Format">
                        <Select
                            size="xs"
                            w="200px"
                            allowDeselect={false}
                            data={[
                                { label: "JSON Schema Draft 2020-12", value: DataTypeRawFormat.jsonSchema },
                                { label: "JSON Type Definition", value: DataTypeRawFormat.jsonTypeDefinition }
                            ]}
                            value={queryArgumentTypeRaw.format}
                            onChange={value => onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, format: value as DataTypeRawFormat })}
                        />
                    </Tooltip>
                    <Tooltip label="Load From File">
                        <ActionIcon variant="default" aria-label="Load From a File" ml="auto" onClick={async () => {
                            const content = await openTextFile(".json");
                            if (content === null) return;
                            if (queryArgumentTypeRaw.format === DataTypeRawFormat.jsonSchema)
                                onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, jsonSchemaText: content });
                            else
                                onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, jsonTypeDefinitionText: content });
                        }}>
                            <IconFileUpload style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <Button variant="default" size="xs" rightSection={<IconChevronDown size={14} />}>Example Schema</Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {examples.map((e, i) => (
                                <Menu.Item key={i} onClick={() => {
                                    if (queryArgumentTypeRaw.format === DataTypeRawFormat.jsonSchema)
                                        onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, jsonSchemaText: e.jsonSchemaText });
                                    else
                                        onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, jsonTypeDefinitionText: e.jsonTypeDefinitionText });
                                }}>{e.name}</Menu.Item>
                            ))}
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            }
        >
            {
                queryArgumentTypeRaw.format === DataTypeRawFormat.jsonSchema
                    ? <JSONEditor key={DataTypeRawFormat.jsonSchema} value={queryArgumentTypeRaw.jsonSchemaText} onValueChanged={v => onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, jsonSchemaText: v })} />
                    : <JSONEditor key={DataTypeRawFormat.jsonTypeDefinition} value={queryArgumentTypeRaw.jsonTypeDefinitionText} onValueChanged={v => onQueryArgumentTypeRawChanged({ ...queryArgumentTypeRaw, jsonTypeDefinitionText: v })} />
            }
        </PanelShell>
    );
});
export default TypePanel;