import { SyntaxDescriptionService } from "@/jsonpath-tools/editor-services/syntax-description-service";
import { defaultJSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathNode } from "@/jsonpath-tools/query/node";
import { JSONPathSyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { JSONPathSyntaxTreeType } from "@/jsonpath-tools/query/syntax-tree-type";
import { JSONPathToken } from "@/jsonpath-tools/query/token";
import { Box, Group, Paper, Stack, Text } from "@mantine/core";
import { memo } from "react";
import PanelShell from "../panel-shell";
import classes from "./outline-panel.module.css";
import { renderMarkdownToHTML } from "@/app/services/markdown";

const OutlinePanel = memo(({
    query,
    onSelectedNodeChanged
}: {
    query: JSONPath,
    onSelectedNodeChanged: (node: JSONPathSyntaxTree | null) => void
}) => {
    return (
        <PanelShell
            toolbar={
                <Group gap="xs">
                </Group>
            }
        >
            <Box m="sm">
                {query !== undefined && <OutlineView tree={query.query} onSelectedNodeChanged={onSelectedNodeChanged} />}
            </Box>
        </PanelShell>
    );
});
export default OutlinePanel;

function OutlineView({
    tree,
    onSelectedNodeChanged
}: {
    tree: JSONPathSyntaxTree,
    onSelectedNodeChanged: (node: JSONPathSyntaxTree | null) => void
}) {
    if (tree instanceof JSONPathToken) return (<></>);
    return (
        <Paper
            p="xs"
            className={getClassName(tree)}
            withBorder
            onMouseOver={e => {
                e.stopPropagation();
                onSelectedNodeChanged(tree);
            }}
            onMouseOut={e => {
                e.stopPropagation();
                onSelectedNodeChanged(null);
            }}
            style={{ minWidth: "300px" }}
        >
            <TreeLabel tree={tree} />
            {tree instanceof JSONPathNode && tree.children.length > 0 && (
                <Stack className={classes.children} mt="xs" bg="var(--mantine-color-body)" gap="xs">
                    {tree.children.map((c, i) => (
                        <OutlineView key={i} tree={c} onSelectedNodeChanged={onSelectedNodeChanged} />
                    ))}
                </Stack>
            )}
        </Paper>
    );
}

function TreeLabel({ tree }: { tree: JSONPathSyntaxTree }) {
    return (
        <Group className={classes.node}>
            <Text fw="500" dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(getLabel(tree)) }}></Text>
        </Group>
    );
}

function getClassName(tree: JSONPathSyntaxTree): string {
    return classNameMap.get(tree.type) ?? "";
}

function getLabel(tree: JSONPathSyntaxTree): string {
    return new SyntaxDescriptionService(defaultJSONPathOptions).provideDescription(tree)?.title ?? tree.type;
}

const classNameMap = new Map<JSONPathSyntaxTreeType, string>([
    [JSONPathSyntaxTreeType.query, classes.query],
    [JSONPathSyntaxTreeType.segment, classes.segment],
    [JSONPathSyntaxTreeType.nameSelector, classes.selector],
    [JSONPathSyntaxTreeType.indexSelector, classes.selector],
    [JSONPathSyntaxTreeType.sliceSelector, classes.selector],
    [JSONPathSyntaxTreeType.wildcardSelector, classes.selector],
    [JSONPathSyntaxTreeType.filterSelector, classes.selector],
    [JSONPathSyntaxTreeType.missingSelector, classes.missing],
    [JSONPathSyntaxTreeType.functionExpression, classes.functionExpression],
    [JSONPathSyntaxTreeType.andExpression, classes.logicalOperator],
    [JSONPathSyntaxTreeType.orExpression, classes.logicalOperator],
    [JSONPathSyntaxTreeType.notExpression, classes.logicalOperator],
    [JSONPathSyntaxTreeType.comparisonExpression, classes.comparisonOperator],
    [JSONPathSyntaxTreeType.stringLiteral, classes.literal],
    [JSONPathSyntaxTreeType.numberLiteral, classes.literal],
    [JSONPathSyntaxTreeType.nullLiteral, classes.literal],
    [JSONPathSyntaxTreeType.booleanLiteral, classes.literal],
    [JSONPathSyntaxTreeType.filterQueryExpression, classes.filterQueryExpression],
    [JSONPathSyntaxTreeType.paranthesisExpression, classes.paranthesisExpression],
    [JSONPathSyntaxTreeType.missingExpression, classes.missing]
]);
