import { JSONPathSyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { Group, ActionIcon, Divider, Menu, Button, Text } from "@mantine/core";
import { IconArrowUp, IconArrowDown, IconRouteSquare, IconChevronDown } from "@tabler/icons-react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";
import { memo } from "react";

const JSONPanel = memo(({
    queryArgumentText,
    onQueryArgumentTextChanged
}: {
    queryArgumentText: string,
    onQueryArgumentTextChanged: (queryArgumentText: string) => void
}) => {
    return (
        <PanelShell
            toolbar={
                <Group gap="xs" w="100%">
                    <Text>1 of <strong>256</strong></Text>
                    <ActionIcon variant="default" aria-label="Settings">
                        <IconArrowUp style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon variant="default" aria-label="Settings">
                        <IconArrowDown style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon variant="default" aria-label="Settings" ml="auto">
                        <IconRouteSquare style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                    <Divider orientation="vertical" />
                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <Button variant="default" size="xs" rightSection={<IconChevronDown size={14} />}>Example Data</Button>
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
            <JSONEditor value={queryArgumentText} onValueChanged={onQueryArgumentTextChanged} />
        </PanelShell>
    );
});
export default JSONPanel;