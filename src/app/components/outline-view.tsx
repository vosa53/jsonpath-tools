import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathNode } from "@/jsonpath-tools/query/node";
import { JSONPathSyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { Group, Paper, Text } from "@mantine/core";
import classes from "./outline-view.module.css"
import { JSONPathToken } from "@/jsonpath-tools/query/token";

export default function OutlineView({ tree }: { tree: JSONPathSyntaxTree }) {
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