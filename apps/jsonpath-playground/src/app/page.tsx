import { DiagnosticsSeverity } from '@/jsonpath-tools/diagnostics';
import { ActionIcon, AppShell, Divider, Flex, Indicator, Stack, Tabs } from '@mantine/core';
import { IconBraces, IconEqual, IconExclamationCircle, IconListTree, IconPlayerPlay, IconRouteSquare, IconSitemap } from '@tabler/icons-react';
import { useMemo, useState } from "react";
import JSONPathEditor from "./components/code-editors/jsonpath-editor";
import Header from "./components/header";
import Navbar from "./components/navbar";
import DiagnosticsPanel from "./components/panels/diagnostics-panel";
import JSONPanel from "./components/panels/json-panel";
import OutlinePanel from "./components/panels/outline-panel";
import PathsPanel from "./components/panels/paths-panel";
import ResultPanel from "./components/panels/result-panel";
import TypePanel from "./components/panels/type-panel";
import { usePageViewModel } from "./page-view-model";
import classes from "./page.module.css";

/**
 * Main page of the application.
 */
export default function Page() {
    const [navbarOpened, setNavbarOpened] = useState(false);
    const viewModel = usePageViewModel();
    const errorCount = useMemo(() => {
        return viewModel.diagnostics.filter(d => d.severity === DiagnosticsSeverity.error).length;
    }, [viewModel.diagnostics]);

    return (
        <AppShell
            header={{ height: 55 }}
            navbar={{
                width: { base: 250, lg: 320 },
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
                    <Flex w="100%" style={{ background: "var(--mantine-color-body)" }}>
                        <JSONPathEditor
                            value={viewModel.queryText}
                            options={viewModel.options}
                            queryArgument={viewModel.queryArgument}
                            queryArgumentType={viewModel.queryArgumentType}
                            highlightedRange={viewModel.highlightedRange}
                            languageService={viewModel.languageService}
                            onValueChanged={viewModel.onQueryTextChanged}
                            onParsed={viewModel.onQueryParsed}
                            onDiagnosticsCreated={viewModel.onDiagnosticsPublished}
                            onGetResultAvailable={viewModel.onGetResultAvailable}
                            onRun={viewModel.onRun} />
                        {!viewModel.settings.autoRun &&
                            <ActionIcon variant="filled" aria-label="Settings" size="lg" style={{ alignSelf: "end" }} m={5.2} onClick={viewModel.onRun}>
                                <IconPlayerPlay style={{ width: '70%', height: '70%' }} stroke={1.5} />
                            </ActionIcon>
                        }
                    </Flex>
                    <Divider size="xs" />
                    <Flex flex="1 1 0" direction={{ sm: "row", base: "column" }}>
                        <Tabs defaultValue="data" flex="1" miw={0} display="flex" style={{ flexDirection: "column" }}>
                            <Tabs.List>
                                <Tabs.Tab value="data" leftSection={<IconBraces size={20} />}>
                                    <Indicator color="red" label="!" size={16} offset={-4} disabled={viewModel.isQueryArgumentValid}>
                                        Data
                                    </Indicator>
                                </Tabs.Tab>
                                <Tabs.Tab value="type" leftSection={<IconSitemap size={20} />}>
                                    <Indicator color="red" label="!" size={16} offset={-4} disabled={viewModel.isQueryArgumentTypeValid}>
                                        Schema
                                    </Indicator>
                                </Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="data" flex="1 1 0" mih={0}>
                                <JSONPanel
                                    queryArgumentText={viewModel.queryArgumentText}
                                    paths={viewModel.resultPaths}
                                    currentPathIndex={viewModel.currentResultPathIndex}
                                    onQueryArgumentTextChanged={viewModel.onQueryArgumentTextChanged}
                                    onCurrentPathIndexChanged={viewModel.onCurrentResultPathIndexChanged}
                                />
                            </Tabs.Panel>
                            <Tabs.Panel value="type" flex="1 1 0" mih={0}>
                                <TypePanel
                                    queryArgumentTypeRaw={viewModel.queryArgumentTypeRaw}
                                    onQueryArgumentTypeRawChanged={viewModel.onQueryArgumentTypeRawChanged} />
                            </Tabs.Panel>
                        </Tabs>
                        <Divider size="xs" orientation="vertical" visibleFrom="sm" />
                        <Divider size="xs" orientation="horizontal" hiddenFrom="sm" />
                        <Tabs defaultValue="result" flex="1" miw={0} display="flex" style={{ flexDirection: "column" }}>
                            <Tabs.List>
                                <Tabs.Tab value="result" leftSection={<IconEqual size={20} />}>
                                    Result
                                </Tabs.Tab>
                                <Tabs.Tab value="paths" leftSection={<IconRouteSquare size={20} />}>
                                    Paths
                                </Tabs.Tab>
                                <Tabs.Tab value="errors" leftSection={<IconExclamationCircle size={20} />}>
                                    <Indicator color="red" label={errorCount} size={16} offset={-4} disabled={errorCount === 0}>
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
                            <Tabs.Panel value="errors" flex="1 1 0" mih={0}>
                                <DiagnosticsPanel
                                    diagnostics={viewModel.diagnostics}
                                    onSelectedDiagnosticsChanged={viewModel.onSelectedDiagnosticsChanged} />
                            </Tabs.Panel>
                            <Tabs.Panel value="outline" flex="1 1 0" mih={0}>
                                <OutlinePanel
                                    query={viewModel.query}
                                    onSelectedNodeChanged={viewModel.onSelectedNodeChanged} />
                            </Tabs.Panel>
                        </Tabs>
                    </Flex>
                </Stack>
            </AppShell.Main>
        </AppShell>
    );
}
