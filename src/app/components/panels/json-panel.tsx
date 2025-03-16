import { JSONPathNormalizedPath } from "@/jsonpath-tools/transformations";
import { ActionIcon, Button, Divider, Group, Loader, Menu, Text } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconChevronDown, IconFileUpload, IconRouteSquare } from "@tabler/icons-react";
import { memo, useState } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";
import { examples } from "@/app/models/examples";
import { openTextFile } from "@/app/services/files";

const JSONPanel = memo(({
    queryArgumentText,
    paths,
    currentPathIndex,
    onQueryArgumentTextChanged,
    onCurrentPathIndexChanged
}: {
    queryArgumentText: string,
    paths: readonly JSONPathNormalizedPath[],
    currentPathIndex: number,
    onQueryArgumentTextChanged: (queryArgumentText: string) => void,
    onCurrentPathIndexChanged: (currentPathIndex: number) => void
}) => {
    const [isParsingInProgress, setIsParsingInProgress] = useState(false);

    return (
        <PanelShell
            toolbar={
                <Group gap="xs" w="100%">
                    <ActionIcon variant="default" aria-label="Settings" disabled={paths.length === 0} onClick={() => onCurrentPathIndexChanged((paths.length + currentPathIndex - 1) % paths.length )}>
                        <IconArrowUp style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon variant="default" aria-label="Settings" disabled={paths.length === 0} onClick={() => onCurrentPathIndexChanged((paths.length + currentPathIndex + 1) % paths.length )}>
                        <IconArrowDown style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                    {paths.length > 0 ? (
                        <Text>{(currentPathIndex + 1).toLocaleString("en-US")} of <strong>{paths.length.toLocaleString("en-US")}</strong></Text>
                    ) : (
                        <Text>No Results</Text>
                    )}
                    {isParsingInProgress && (
                        <>
                        <Divider orientation="vertical" />
                        <Loader size="sm" />
                        <Text>Parsing...</Text>
                        </>
                    )}
                    <ActionIcon variant="default" aria-label="Settings" ml="auto">
                        <IconRouteSquare style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                    <Divider orientation="vertical" />
                    <ActionIcon variant="default" aria-label="Settings" onClick={async () => {
                        const content = await openTextFile(".json");
                        if (content !== null) onQueryArgumentTextChanged(content);
                    }}>
                        <IconFileUpload style={{ width: '70%', height: '70%' }} stroke={1.5} />
                    </ActionIcon>
                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <Button variant="default" size="xs" rightSection={<IconChevronDown size={14} />}>Example Data</Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {examples.map((e, i) => (
                                <Menu.Item key={i} onClick={() => onQueryArgumentTextChanged(e.jsonText)}>{e.name}</Menu.Item>
                            ))}
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            }
        >
            <JSONEditor 
                value={queryArgumentText}
                paths={paths}
                currentPath={currentPathIndex < paths.length ? paths[currentPathIndex] : []}
                onValueChanged={onQueryArgumentTextChanged}
                onParsingProgressChanged={setIsParsingInProgress} />
        </PanelShell>
    );
});
export default JSONPanel;