import { Button, Group, Menu } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { memo } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";

const JSONSchemaPanel = memo(({
    queryArgumentSchemaText,
    onQueryArgumentSchemaTextChanged
}: {
    queryArgumentSchemaText: string,
    onQueryArgumentSchemaTextChanged: (queryArgumentSchemaText: string) => void
}) => {
    return (
        <PanelShell
            toolbar={
                <Group gap="xs" w="100%">
                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <Button variant="default" size="xs" ml="auto" rightSection={<IconChevronDown size={14} />}>Example Schema</Button>
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
            <JSONEditor value={queryArgumentSchemaText} onValueChanged={onQueryArgumentSchemaTextChanged} />
        </PanelShell>
    );
});
export default JSONSchemaPanel;