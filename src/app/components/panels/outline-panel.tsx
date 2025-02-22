import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathNode } from "@/jsonpath-tools/query/node";
import { JSONPathSyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { Group, Paper, Text } from "@mantine/core";
import classes from "./outline-panel.module.css"
import { JSONPathToken } from "@/jsonpath-tools/query/token";
import PanelShell from "../panel-shell";
import { memo } from "react";

const OutlinePanel = memo(({ query }: { query: JSONPath }) => {
    return (
        <PanelShell
            toolbar={
                <Group gap="xs">
                </Group>
            }
        >
            {query !== undefined && <OutlineView tree={query} />}
        </PanelShell>
    );
});
export default OutlinePanel;

function OutlineView({ tree }: { tree: JSONPathSyntaxTree }) {
    return (
        <div>
            {/* <TreeLabel tree={tree} />
            {tree instanceof JSONPathNode && (
                <div className={classes.children}>
                    {tree.children.map((c, i) => (
                        <OutlineView key={i} tree={c} />
                    ))}
                </div>
            )} */}
        </div>
    );
}

function TreeLabel({ tree }: { tree: JSONPathSyntaxTree }) {
    return (
        <Group className={classes.node}>
            {tree instanceof JSONPathToken && <Text c="yellow">TOKEN</Text>}
            {tree instanceof JSONPathNode && <Text c="green">NODE</Text>}
            <span>{tree.type}</span>
            {tree instanceof JSONPathToken && <Text c="dimmed">{tree.text}</Text>}
        </Group>
    );
}