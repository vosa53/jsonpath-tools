"use client"

import { JSONPathQueryContext } from "@/jsonpath-tools/query/evaluation";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { Accordion, ActionIcon, AppShell, Burger, Divider, Flex, Group, Indicator, Stack, Tabs, Title, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBraces, IconEqual, IconExclamationCircle, IconHelp, IconListTree, IconMathFunction, IconMoon, IconRoute, IconRouteSquare, IconSun } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from "react";
import { JSONPathDiagnostics } from "../jsonpath-tools/diagnostics";
import { defaultJSONPathOptions } from "../jsonpath-tools/options";
import DiagnosticsView from "./components/diagnostics-view";
import JSONEditor from "./components/json-editor";
import JSONPathEditor from "./components/jsonpath-editor";
import classes from "./styles/page.module.css";
import OutlineView from "./components/outline-view";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";

export const testJson = `{
    "store": {
        "books": [
            {
                "category": "reference",
                "author": "Nigel Rees",
                "title": "Sayings of the Century",
                "price": 8.95
            },
            {
                "category": "fiction",
                "author": "Evelyn Waugh",
                "title": "Sword of Honour",
                "price": 12.99
            },
            {
                "category": "fiction",
                "author": "Herman Melville",
                "title": "Moby Dick",
                "isbn": "0-553-21311-3",
                "price": 8.99
            },
            {
                "category": "fiction",
                "author": "J. R. R. Tolkien",
                "title": "The Lord of the Rings",
                "isbn": "0-395-19395-8",
                "price": 22.99
            }
        ],
        "bicycle": {
            "color": "red",
            "price": 399
        }
    }
}`;

export default function Home() {
    const colorScheme = useMantineColorScheme();
    const [opened, { toggle }] = useDisclosure();

    const [queryText, setQueryText] = useState("$.books[?@.author == \"George Orwell\" && count(true, 25) > 42].title");
    const [query, setQuery] = useState<JSONPath>();

    const [queryArgumentText, setQueryArgumentText] = useState(testJson);
    const queryArgument = useMemo<JSONPathJSONValue>(() => {
        try {
            return JSON.parse(queryArgumentText);
        }
        catch {
            return null;
        }
    }, [queryArgumentText]);

    
    const [resultText, setResultText] = useState("");
    const [resultPathsText, setResultPathsText] = useState("");
    const [diagnostics, setDiagnostics] = useState<readonly JSONPathDiagnostics[]>([]);
    /*const result = useMemo(() => {
        if (jsonPath === undefined)
            return "";
        const value = JSON.parse(inputValue);
        const time = performance.now();
        const queryContext: JSONPathQueryContext = { rootNode: value, options: defaultJSONPathOptions };
        const nodes = jsonPath.select(queryContext).nodes;
        console.log("QUERY TIME:", performance.now() - time, "ms", jsonPath);
        return JSON.stringify(nodes, null, 4);
        return "";
    }, [queryArgumentText, query]);*/

    return (
        <AppShell
            header={{ height: 55 }}
            navbar={{
                width: { base: 250, lg: 300 },
                breakpoint: "md",
                collapsed: { mobile: !opened },
            }}
            padding="0">
            <AppShell.Header className={classes.header}>
                <Flex justify="space-between">
                    <Group p="xs" c="violet.4" gap={0}>
                        <Burger
                            opened={opened}
                            onClick={toggle}
                            hiddenFrom="md"
                            size="sm"
                            color="violet.4" />
                        <IconRoute size={33} stroke={2} />
                        <Title order={1} size="24" pl="xs" fw="600">JSONPath Playground</Title>
                    </Group>
                    <Group pr="xs">
                        <ActionIcon variant="subtle" color="violet" size="lg" aria-label="Set dark color scheme" darkHidden onClick={() => colorScheme.setColorScheme("dark")}>
                            <IconMoon style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="violet" size="lg" aria-label="Set light color scheme" lightHidden onClick={() => colorScheme.setColorScheme("light")}>
                            <IconSun style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                    </Group>
                </Flex>
            </AppShell.Header>

            <AppShell.Navbar className={classes.navbar}>
                <Accordion>
                    <Accordion.Item value="reference">
                        <Accordion.Control icon={<IconHelp size={20} />}>
                            Language Reference
                        </Accordion.Control>
                        <Accordion.Panel>JSONPath defines a string syntax for selecting and extracting JSON
                            (RFC 8259) values from within a given JSON value.</Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="print">
                        <Accordion.Control icon={<IconMathFunction size={20} />}>
                            Custom Functions
                        </Accordion.Control>
                        <Accordion.Panel>Content</Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </AppShell.Navbar>

            <AppShell.Main className={classes.navbar} h="100vh">
                <Stack gap={0} h="100%">
                    <JSONPathEditor 
                        value={queryText} 
                        queryArgument={queryArgument} 
                        onValueChanged={setQueryText} 
                        onParsed={setQuery}
                        onDiagnosticsCreated={setDiagnostics}
                        onResultCreated={r => { setResultText(JSON.stringify(r.nodes, undefined, 4)); setResultPathsText(JSON.stringify(r.paths, undefined, 4)); }} />
                    <Divider size="xs" />
                    <Flex flex="1 1 0" direction={{ sm: "row", base: "column" }}>
                        <Tabs defaultValue="json" flex="1" miw={0} display="flex" style={{ flexDirection: "column" }}>
                            <Tabs.List>
                                <Tabs.Tab value="json" leftSection={<IconBraces size={20} />}>
                                    JSON
                                </Tabs.Tab>
                                <Tabs.Tab value="jsonSchema" leftSection={<IconBraces size={20} />}>
                                    JSON Schema
                                </Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="json" flex="1 1 0" mih={0}>
                                <JSONEditor value={queryArgumentText} onValueChanged={setQueryArgumentText} />
                            </Tabs.Panel>
                            <Tabs.Panel value="jsonSchema">
                                Messages tab content
                            </Tabs.Panel>
                        </Tabs>
                        <Divider size="xs" orientation="vertical" />
                        <Tabs defaultValue="result" flex="1" miw={0} display="flex" style={{ flexDirection: "column" }}>
                            <Tabs.List>
                                <Tabs.Tab value="result" leftSection={<IconEqual size={20} />}>
                                    Result
                                </Tabs.Tab>
                                <Tabs.Tab value="paths" leftSection={<IconRouteSquare size={20} />}>
                                    Paths
                                </Tabs.Tab>
                                <Tabs.Tab value="errors" leftSection={<IconExclamationCircle size={20} />}>
                                    <Indicator color="red" label={diagnostics.length} size={16} offset={-4} disabled={diagnostics.length === 0}>
                                        Errors
                                    </Indicator>
                                </Tabs.Tab>
                                <Tabs.Tab value="outline" leftSection={<IconListTree size={20} />}>
                                    Outline
                                </Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="result" flex="1 1 0" mih={0}>
                                <JSONEditor value={resultText} readonly onValueChanged={() => { }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="paths" flex="1 1 0" mih={0}>
                                <JSONEditor value={resultPathsText} readonly onValueChanged={() => { }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="errors" flex="1 1 0" mih={0} style={{ overflow: "auto" }}>
                                <DiagnosticsView diagnostics={diagnostics} />
                            </Tabs.Panel>
                            <Tabs.Panel value="outline" flex="1 1 0" mih={0} style={{ overflow: "auto" }}>
                                { query !== undefined && <OutlineView tree={query}/> }
                            </Tabs.Panel>
                        </Tabs>
                    </Flex>
                </Stack>
            </AppShell.Main>
        </AppShell>
    );
}
