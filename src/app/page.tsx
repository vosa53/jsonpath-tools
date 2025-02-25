"use client"

import { AppShell, Divider, Flex, Indicator, Stack, Tabs } from '@mantine/core';
import { IconBraces, IconEqual, IconExclamationCircle, IconListTree, IconRouteSquare } from '@tabler/icons-react';
import { useState } from "react";
import JSONPathEditor from "./components/code-editors/jsonpath-editor";
import Header from "./components/header";
import Navbar from "./components/navbar";
import DiagnosticsPanel from "./components/panels/diagnostics-panel";
import JSONPanel from "./components/panels/json-panel";
import JSONSchemaPanel from "./components/panels/json-schema-panel";
import OutlinePanel from "./components/panels/outline-panel";
import PathsPanel from "./components/panels/paths-panel";
import ResultPanel from "./components/panels/result-panel";
import { usePageViewModel } from "./page-view-model";
import classes from "./styles/page.module.css";

export default function Home() {
    const [navbarOpened, setNavbarOpened] = useState(false);
    const viewModel = usePageViewModel();
    
    return (
        <AppShell
            header={{ height: 55 }}
            navbar={{
                width: { base: 250, lg: 300 },
                breakpoint: "md",
                collapsed: { mobile: !navbarOpened }
            }}
            padding="0">
            <AppShell.Header className={classes.header}>
                <Header navbarOpened={navbarOpened} onNavbarOpenedChanged={setNavbarOpened} />
            </AppShell.Header>

            <AppShell.Navbar className={classes.navbar}>
                <Navbar
                    customFunctions={viewModel.customFunctions}
                    settings={viewModel.settings}
                    onCustomFunctionsChanged={viewModel.onCustomFunctionsChanged}
                    onSettingsChanged={viewModel.onSettingsChanged} />
            </AppShell.Navbar>

            <AppShell.Main className={classes.navbar} h="100vh">
                <Stack gap={0} h="100%">
                    <JSONPathEditor
                        value={viewModel.queryText}
                        queryArgument={viewModel.queryArgument}
                        onValueChanged={viewModel.onQueryTextChanged}
                        onParsed={viewModel.onQueryParsed}
                        onDiagnosticsCreated={viewModel.onDiagnosticsPublished}
                        onGetResultAvailable={viewModel.onGetResultAvailable} />
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
                                <JSONPanel
                                    queryArgumentText={viewModel.queryArgumentText}
                                    paths={viewModel.resultPaths}
                                    currentPathIndex={viewModel.currentResultPathIndex}
                                    onQueryArgumentTextChanged={viewModel.onQueryArgumentTextChanged}
                                    onCurrentPathIndexChanged={viewModel.onCurrentResultPathIndexChanged}
                                />
                            </Tabs.Panel>
                            <Tabs.Panel value="jsonSchema" flex="1 1 0" mih={0}>
                                <JSONSchemaPanel 
                                    queryArgumentSchemaText="" 
                                    onQueryArgumentSchemaTextChanged={() => { }} />
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
                                    <Indicator color="red" label={viewModel.diagnostics.length} size={16} offset={-4} disabled={viewModel.diagnostics.length === 0}>
                                        Errors
                                    </Indicator>
                                </Tabs.Tab>
                                <Tabs.Tab value="outline" leftSection={<IconListTree size={20} />}>
                                    Outline
                                </Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="result" flex="1 1 0" mih={0}>
                                <ResultPanel 
                                    resultText={viewModel.resultText} 
                                    operation={viewModel.operation} 
                                    onOperationChanged={viewModel.onOperationChanged} />
                            </Tabs.Panel>
                            <Tabs.Panel value="paths" flex="1 1 0" mih={0}>
                                <PathsPanel 
                                    pathsText={viewModel.resultPathsText} 
                                    pathType={viewModel.pathType} 
                                    onPathTypeChanged={viewModel.onPathTypeChanged} />
                            </Tabs.Panel>
                            <Tabs.Panel value="errors" flex="1 1 0" mih={0} style={{ overflow: "auto" }}>
                                <DiagnosticsPanel 
                                    diagnostics={viewModel.diagnostics} />
                            </Tabs.Panel>
                            <Tabs.Panel value="outline" flex="1 1 0" mih={0} style={{ overflow: "auto" }}>
                                <OutlinePanel 
                                    query={viewModel.query} />
                            </Tabs.Panel>
                        </Tabs>
                    </Flex>
                </Stack>
            </AppShell.Main>
        </AppShell>
    );
}
