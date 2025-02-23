"use client"

import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathParser } from "@/jsonpath-tools/syntax-analysis/parser";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { AppShell, Divider, Flex, Indicator, Stack, Tabs } from '@mantine/core';
import { IconBraces, IconEqual, IconExclamationCircle, IconListTree, IconRouteSquare } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from "react";
import { JSONPathDiagnostics } from "../jsonpath-tools/diagnostics";
import { OperationCancelledError } from "./components/code-editors/codemirror/jsonpath-codemirror/cancellation-token";
import JSONPathEditor from "./components/code-editors/jsonpath-editor";
import Header from "./components/header";
import Navbar from "./components/navbar";
import DiagnosticsPanel from "./components/panels/diagnostics-panel";
import JSONPanel from "./components/panels/json-panel";
import JSONSchemaPanel from "./components/panels/json-schema-panel";
import OutlinePanel from "./components/panels/outline-panel";
import PathsPanel from "./components/panels/paths-panel";
import ResultPanel from "./components/panels/result-panel";
import { CustomFunction } from "./models/custom-function";
import { Operation, OperationType } from "./models/operation";
import { PathType } from "./models/path-type";
import classes from "./styles/page.module.css";
import { JSONPathNormalizedPath } from "@/jsonpath-tools/transformations";

export default function Home() {
    const [navbarOpened, setNavbarOpened] = useState(false);
    const [customFunctions, setCustomFunctions] = useState<readonly CustomFunction[]>([]);

    const [queryText, setQueryText] = useState(testQueryText);
    const [query, setQuery] = useState<JSONPath>(testQuery);

    const [queryArgumentText, setQueryArgumentText] = useState(testJson);
    const queryArgument = useMemo<JSONPathJSONValue>(() => {
        try {
            return JSON.parse(queryArgumentText);
        }
        catch {
            return null;
        }
    }, [queryArgumentText]);

    const getResultRef = useRef<() => Promise<{ nodes: readonly JSONPathJSONValue[], paths: readonly (string | number)[][] }>>(null);
    const resultTimeoutRef = useRef<number | null>(null);
    const [operation, setOperation] = useState<Operation>({ type: OperationType.select, replacement: { replacement: {} } });
    const [pathType, setPathType] = useState<PathType>(PathType.normalizedPath);

    useEffect(() => {
        if (getResultRef.current === null) return;
        if (resultTimeoutRef.current !== null) window.clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = window.setTimeout(async () => {
            try {
                const result = await getResultRef.current!();
                setResultPaths(result.paths);
                setResultText(JSON.stringify(result.nodes, undefined, 4));
                setResultPathsText(JSON.stringify(result.paths, undefined, 4));
                setCurrentResultPathIndex(0);
            }
            catch (error) {
                if (!(error instanceof OperationCancelledError)) throw error;
            }
        }, 500);
    }, [queryText, queryArgument, getResultRef.current]);

    const [resultPaths, setResultPaths] = useState<readonly JSONPathNormalizedPath[]>([]);
    const [resultText, setResultText] = useState("");
    const [resultPathsText, setResultPathsText] = useState("");
    const [currentResultPathIndex, setCurrentResultPathIndex] = useState<number>(0);
    const [diagnostics, setDiagnostics] = useState<readonly JSONPathDiagnostics[]>([]);

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
                <Navbar customFunctions={customFunctions} onCustomFunctionsChanged={setCustomFunctions} />
            </AppShell.Navbar>

            <AppShell.Main className={classes.navbar} h="100vh">
                <Stack gap={0} h="100%">
                    <JSONPathEditor
                        value={queryText}
                        queryArgument={queryArgument}
                        onValueChanged={setQueryText}
                        onParsed={setQuery}
                        onDiagnosticsCreated={setDiagnostics}
                        onGetResultAvailable={gr => {
                            getResultRef.current = gr;
                            /*const start = performance.now();
                            const replaced = replace(queryArgument, r.paths, "pes");
                            const elapsed = performance.now() - start;
                            console.log("Replace took", elapsed, "ms");


                            const start2 = performance.now();
                            const res = JSON.stringify(replaced, undefined, 4);
                            const elapsed2 = performance.now() - start2;
                            console.log("Stringify took", elapsed2, "ms");

                            const start3 = performance.now();
                            const res2 = JSON.parse(res);
                            const elapsed3 = performance.now() - start3;
                            console.log("Parse took", elapsed3, "ms");

                            setResultText(res);
                            setResultPathsText(JSON.stringify(r.paths, undefined, 4));*/

                            /*setResultText(JSON.stringify(r.nodes, undefined, 4)); 
                            setResultPathsText(JSON.stringify(r.paths, undefined, 4));*/
                        }} />
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
                                    queryArgumentText={queryArgumentText} 
                                    paths={resultPaths} 
                                    currentPathIndex={currentResultPathIndex} 
                                    onQueryArgumentTextChanged={setQueryArgumentText}
                                    onCurrentPathIndexChanged={setCurrentResultPathIndex}
                                />
                            </Tabs.Panel>
                            <Tabs.Panel value="jsonSchema" flex="1 1 0" mih={0}>
                                <JSONSchemaPanel queryArgumentSchemaText="" onQueryArgumentSchemaTextChanged={() => {}} />
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
                                <ResultPanel resultText={resultText} operation={operation} onOperationChanged={setOperation} />
                            </Tabs.Panel>
                            <Tabs.Panel value="paths" flex="1 1 0" mih={0}>
                                <PathsPanel pathsText={resultPathsText} pathType={pathType} onPathTypeChanged={setPathType} />
                            </Tabs.Panel>
                            <Tabs.Panel value="errors" flex="1 1 0" mih={0} style={{ overflow: "auto" }}>
                                <DiagnosticsPanel diagnostics={diagnostics} />
                            </Tabs.Panel>
                            <Tabs.Panel value="outline" flex="1 1 0" mih={0} style={{ overflow: "auto" }}>
                                <OutlinePanel query={query} />
                            </Tabs.Panel>
                        </Tabs>
                    </Flex>
                </Stack>
            </AppShell.Main>
        </AppShell>
    );
}

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

const testQueryText = "$.books[?@.author == \"George Orwell\" && count(true, 25) > 42].title";
const testQuery = new JSONPathParser().parse(testQueryText);