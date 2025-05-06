import { serializedNormalizedPath } from "@jsonpath-tools/jsonpath";
import { NormalizedPath } from "@jsonpath-tools/jsonpath";
import { ActionIcon, Button, CopyButton, Divider, Group, Loader, Menu, Popover, Text, TextInput, Tooltip } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconChevronDown, IconFileUpload, IconRouteSquare } from "@tabler/icons-react";
import { memo, useRef, useState } from "react";
import JSONEditor from "../code-editors/json-editor";
import PanelShell from "../panel-shell";
import { examples } from "../../models/examples";
import { openTextFile } from "../../services/files";

/**
 * Panel for query argument JSON editation.
 */
const JSONPanel = memo(({
    queryArgumentText,
    paths,
    currentPathIndex,
    onQueryArgumentTextChanged,
    onCurrentPathIndexChanged
}: {
    queryArgumentText: string,
    paths: readonly NormalizedPath[],
    currentPathIndex: number,
    onQueryArgumentTextChanged: (queryArgumentText: string) => void,
    onCurrentPathIndexChanged: (currentPathIndex: number) => void
}) => {
    const [isParsingInProgress, setIsParsingInProgress] = useState(false);
    const currentNormalizedPathGetter = useRef(() => [] as NormalizedPath);
    const [currentNormalizedPath, setCurrentNormalizedPath] = useState("$");

    return (
        <PanelShell
            toolbar={
                <>
                    <Tooltip label="Previous Result">
                        <ActionIcon variant="default" aria-label="Previous Result" disabled={paths.length === 0} onClick={() => onCurrentPathIndexChanged((paths.length + currentPathIndex - 1) % paths.length)}>
                            <IconArrowUp style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Next Result">
                        <ActionIcon variant="default" aria-label="Next Result" disabled={paths.length === 0} onClick={() => onCurrentPathIndexChanged((paths.length + currentPathIndex + 1) % paths.length)}>
                            <IconArrowDown style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
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
                    <Popover width={400} position="bottom" withArrow shadow="md" onChange={() => setCurrentNormalizedPath(serializedNormalizedPath(currentNormalizedPathGetter.current()))}>
                        <Popover.Target>
                            <Tooltip label="Normalized Path under Caret">
                                <ActionIcon variant="default" aria-label="Get Normalized Path under the Caret" ml="auto">
                                    <IconRouteSquare style={{ width: "70%", height: "70%" }} stroke={1.5} />
                                </ActionIcon>
                            </Tooltip>
                        </Popover.Target>
                        <Popover.Dropdown style={{ maxWidth: "calc(100vw - var(--mantine-spacing-xs))" }}>
                            <Group align="end" gap="xs">
                                <TextInput label="Normalized Path under the Caret" value={currentNormalizedPath} readOnly flex="1 1 0" />
                                <CopyButton value={currentNormalizedPath}>
                                    {({ copied, copy }) => (
                                        <Button color={copied ? "teal" : "violet"} onClick={copy}>
                                            {copied ? "Copied" : "Copy"}
                                        </Button>
                                    )}
                                </CopyButton>
                            </Group>
                        </Popover.Dropdown>
                    </Popover>
                    <Divider orientation="vertical" />
                    <Tooltip label="Load From File">
                        <ActionIcon variant="default" aria-label="Load From a File" onClick={async () => {
                            const content = await openTextFile(".json");
                            if (content !== null) onQueryArgumentTextChanged(content);
                        }}>
                            <IconFileUpload style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
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
                </>
            }
        >
            <JSONEditor
                value={queryArgumentText}
                paths={paths}
                currentPath={currentPathIndex < paths.length ? paths[currentPathIndex] : []}
                onValueChanged={onQueryArgumentTextChanged}
                onCurrentPathChanged={v => currentNormalizedPathGetter.current = v}
                onParsingProgressChanged={setIsParsingInProgress} />
        </PanelShell>
    );
});
export default JSONPanel;