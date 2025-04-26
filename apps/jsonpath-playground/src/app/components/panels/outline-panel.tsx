import { SyntaxDescriptionService } from "@jsonpath-tools/jsonpath";
import { defaultQueryOptions } from "@jsonpath-tools/jsonpath";
import { Query } from "@jsonpath-tools/jsonpath";
import { SyntaxTreeNode } from "@jsonpath-tools/jsonpath";
import { SyntaxTree } from "@jsonpath-tools/jsonpath";
import { SyntaxTreeType } from "@jsonpath-tools/jsonpath";
import { SyntaxTreeToken } from "@jsonpath-tools/jsonpath";
import { Box, Group, Paper, Stack } from "@mantine/core";
import { memo } from "react";
import PanelShell from "../panel-shell";
import classes from "./outline-panel.module.css";
import { MarkdownView } from "../markdown-view";

/**
 * Panel displaying JSONPath query in a tree form.
 */
const OutlinePanel = memo(({
    query,
    onSelectedNodeChanged
}: {
    query: Query,
    onSelectedNodeChanged: (node: SyntaxTree | null) => void
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
    tree: SyntaxTree,
    onSelectedNodeChanged: (node: SyntaxTree | null) => void
}) {
    if (tree instanceof SyntaxTreeToken) return (<></>);
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
            {tree instanceof SyntaxTreeNode && tree.children.length > 0 && (
                <Stack className={classes.children} mt="xs" bg="var(--mantine-color-body)" gap="xs">
                    {tree.children.map((c, i) => (
                        <OutlineView key={i} tree={c} onSelectedNodeChanged={onSelectedNodeChanged} />
                    ))}
                </Stack>
            )}
        </Paper>
    );
}

function TreeLabel({ tree }: { tree: SyntaxTree }) {
    return (
        <Group className={classes.node}>
            <div style={{ fontWeight: "500" }}>
                <MarkdownView markdown={getLabel(tree)} />
            </div>
        </Group>
    );
}

function getClassName(tree: SyntaxTree): string {
    return classNameMap.get(tree.type) ?? "";
}

function getLabel(tree: SyntaxTree): string {
    return syntaxDescriptionService.provideDescription(tree)?.title ?? tree.type;
}

const classNameMap = new Map<SyntaxTreeType, string>([
    [SyntaxTreeType.subQuery, classes.query],
    [SyntaxTreeType.segment, classes.segment],
    [SyntaxTreeType.nameSelector, classes.selector],
    [SyntaxTreeType.indexSelector, classes.selector],
    [SyntaxTreeType.sliceSelector, classes.selector],
    [SyntaxTreeType.wildcardSelector, classes.selector],
    [SyntaxTreeType.filterSelector, classes.selector],
    [SyntaxTreeType.missingSelector, classes.missing],
    [SyntaxTreeType.functionExpression, classes.functionExpression],
    [SyntaxTreeType.andExpression, classes.logicalOperator],
    [SyntaxTreeType.orExpression, classes.logicalOperator],
    [SyntaxTreeType.notExpression, classes.logicalOperator],
    [SyntaxTreeType.comparisonExpression, classes.comparisonOperator],
    [SyntaxTreeType.stringLiteralExpression, classes.literal],
    [SyntaxTreeType.numberLiteralExpression, classes.literal],
    [SyntaxTreeType.nullLiteralExpression, classes.literal],
    [SyntaxTreeType.booleanLiteralExpression, classes.literal],
    [SyntaxTreeType.filterQueryExpression, classes.filterQueryExpression],
    [SyntaxTreeType.paranthesisExpression, classes.paranthesisExpression],
    [SyntaxTreeType.missingExpression, classes.missing]
]);

const syntaxDescriptionService = new SyntaxDescriptionService(defaultQueryOptions);