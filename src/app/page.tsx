"use client"

import JSONPathEditor from "./jsonpath-editor";
import { Accordion, AppShell, Box, Burger, Divider, Flex, Grid, Group, Stack, Tabs, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBraces, IconEqual, IconExclamationCircle, IconFunction, IconHelp, IconListTree, IconMathFunction, IconRoute, IconRoute2, IconRouteAltLeft, IconRouteSquare } from '@tabler/icons-react';
import JSONEditor from "./json-editor";
import { useState } from "react";
import { JSONPath } from "./parser/expression";
import { Diagnostics } from "next/dist/build/swc/types";
import { JSONPathDiagnostics } from "./parser/jsonpath-diagnostics";
import DiagnosticsView from "./components/diagnostics-view";

const testJson = `{
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
    const [editorValue, setEditorValue] = useState("$.books[?@.author == \"George Orwell\" && count(true, 25) > 42].title");
    const [jsonPath, setJsonPath] = useState<JSONPath>();
    const [diagnostics, setDiagnostics] = useState<readonly JSONPathDiagnostics[]>([]);
    const [opened, { toggle }] = useDisclosure();

    return (
        <AppShell
            header={{ height: 55 }}
            navbar={{
                width: 300,
                breakpoint: "sm",
                collapsed: { mobile: !opened },
            }}
            padding="0">
            <AppShell.Header bg="teal.2">
                <Group p="xs" c="dark.8" gap={0}>
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                        color="white" />
                    <IconRoute size={35} stroke={3}/>
                    <Title order={1} size="25" pl="xs" fw="normal">JSONPath Playground</Title>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar bg="gray.1">
                <Accordion>
                    <Accordion.Item value="reference">
                        <Accordion.Control icon={<IconHelp size={20}/>}>
                            Language Reference
                        </Accordion.Control>
                        <Accordion.Panel>Content</Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="print">
                        <Accordion.Control icon={<IconMathFunction size={20}/>}>
                            Custom Functions
                        </Accordion.Control>
                        <Accordion.Panel>Content</Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </AppShell.Navbar>

            <AppShell.Main bg="gray.1" h="100vh">
                <Stack gap={0} h="100%">
                    <JSONPathEditor value={editorValue} onValueChanged={setEditorValue} onParsed={setJsonPath} onDiagnosticsCreated={setDiagnostics} />
                    <Flex flex="1 1 0">
                        <Tabs defaultValue="json" flex="1" display="flex" style={{flexDirection: "column"}}>
                            <Tabs.List>
                                <Tabs.Tab value="json" leftSection={<IconBraces size={20} />}>
                                    JSON
                                </Tabs.Tab>
                                <Tabs.Tab value="jsonSchema" leftSection={<IconBraces size={20} />}>
                                    JSON Schema
                                </Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="json" flex="1 1 0" mih={0}>
                                <JSONEditor value={testJson} onValueChanged={() => {}} />
                            </Tabs.Panel>
                            <Tabs.Panel value="jsonSchema">
                                Messages tab content
                            </Tabs.Panel>
                        </Tabs>
                        <Divider size="xs" orientation="vertical" />
                        <Tabs defaultValue="errors" flex="1" display="flex" style={{flexDirection: "column"}}>
                            <Tabs.List>
                                <Tabs.Tab value="errors" leftSection={<IconExclamationCircle size={20} />}>
                                    Errors
                                </Tabs.Tab>
                                <Tabs.Tab value="outline" leftSection={<IconListTree size={20} />}>
                                    Outline
                                </Tabs.Tab>
                                <Tabs.Tab value="values" leftSection={<IconEqual size={20} />}>
                                    Values
                                </Tabs.Tab>
                                <Tabs.Tab value="paths" leftSection={<IconRouteSquare size={20} />}>
                                    Paths
                                </Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="errors" flex="1 1 0">
                                <DiagnosticsView diagnostics={diagnostics}/>
                            </Tabs.Panel>
                            <Tabs.Panel value="outline">
                                Messages tab content
                            </Tabs.Panel>
                            <Tabs.Panel value="values">
                                Messages tab content
                            </Tabs.Panel>
                            <Tabs.Panel value="paths">
                                Messages tab content
                            </Tabs.Panel>
                        </Tabs>
                    </Flex>
                </Stack>
            </AppShell.Main>
        </AppShell>
    );
}
