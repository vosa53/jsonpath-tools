import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathNode } from "@/jsonpath-tools/query/node";
import { JSONPathSyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { Box, Group, Paper, Stack, Text } from "@mantine/core";
import classes from "./outline-panel.module.css"
import { JSONPathToken } from "@/jsonpath-tools/query/token";
import PanelShell from "../panel-shell";
import { memo } from "react";
import { JSONPathSyntaxTreeType } from "@/jsonpath-tools/query/syntax-tree-type";
import { JSONPathQuery } from "@/jsonpath-tools/query/query";
import { JSONPathSegment } from "@/jsonpath-tools/query/segment";
import { JSONPathFilterSelector } from "@/jsonpath-tools/query/selectors/filter-selector";
import { JSONPathNameSelector } from "@/jsonpath-tools/query/selectors/name-selector";
import { JSONPathStringLiteral } from "@/jsonpath-tools/query/filter-expression/string-literal";
import { JSONPathAndExpression } from "@/jsonpath-tools/query/filter-expression/and-expression";
import { JSONPathOrExpression } from "@/jsonpath-tools/query/filter-expression/or-expression";
import { JSONPathComparisonExpression } from "@/jsonpath-tools/query/filter-expression/comparison-expression";
import { JSONPathFunctionExpression } from "@/jsonpath-tools/query/filter-expression/function-expression";
import { JSONPathFilterQueryExpression } from "@/jsonpath-tools/query/filter-expression/filter-query-expression";

const OutlinePanel = memo(({ query }: { query: JSONPath }) => {
    return (
        <PanelShell
            toolbar={
                <Group gap="xs">
                </Group>
            }
        >
            <Box m="sm">
                {query !== undefined && <OutlineView tree={query.query} />}
            </Box>
        </PanelShell>
    );
});
export default OutlinePanel;

function OutlineView({ tree }: { tree: JSONPathSyntaxTree }) {
    if (tree instanceof JSONPathToken) return (<></>);
    return (
        <Paper p="xs" className={getClassName(tree)} withBorder>
            <TreeLabel tree={tree} />
            {tree instanceof JSONPathNode && tree.children.length > 0 && (
                <Stack className={classes.children} mt="xs" bg="var(--mantine-color-body)" gap="xs">
                    {tree.children.map((c, i) => (
                        <OutlineView key={i} tree={c} />
                    ))}
                </Stack>
            )}
        </Paper>
    );
}

function TreeLabel({ tree }: { tree: JSONPathSyntaxTree }) {
    return (
        <Group className={classes.node}>
            <Text fw="500">{getLabel(tree)}</Text>
            {tree instanceof JSONPathToken && <Text c="dimmed">{tree.text}</Text>}
        </Group>
    );
}

function getClassName(tree: JSONPathSyntaxTree): string {
    return classNameMap.get(tree.type) ?? "";
}

const classNameMap = new Map<JSONPathSyntaxTreeType, string>([
    [JSONPathSyntaxTreeType.query, classes.query],
    [JSONPathSyntaxTreeType.segment, classes.segment],
    [JSONPathSyntaxTreeType.nameSelector, classes.selector],
    [JSONPathSyntaxTreeType.filterSelector, classes.selector],
    [JSONPathSyntaxTreeType.functionExpression, classes.functionExpression],
    [JSONPathSyntaxTreeType.andExpression, classes.logicalOperator],
    [JSONPathSyntaxTreeType.orExpression, classes.logicalOperator],
    [JSONPathSyntaxTreeType.notExpression, classes.logicalOperator],
    [JSONPathSyntaxTreeType.comparisonExpression, classes.comparisonOperator],
    [JSONPathSyntaxTreeType.stringLiteral, classes.literal],
    [JSONPathSyntaxTreeType.numberLiteral, classes.literal],
    [JSONPathSyntaxTreeType.nullLiteral, classes.literal],
    [JSONPathSyntaxTreeType.booleanLiteral, classes.literal],
    [JSONPathSyntaxTreeType.filterQueryExpression, classes.filterQueryExpression]
]);

function getLabel(tree: JSONPathSyntaxTree): string {
    if (tree instanceof JSONPathQuery) return "$ Query";
    if (tree instanceof JSONPathSegment) return "[] Segment";
    if (tree instanceof JSONPathFilterSelector) return "? Filter Selector";
    if (tree instanceof JSONPathNameSelector) return ". Name Selector";
    if (tree instanceof JSONPathStringLiteral) return "\"\" String";
    if (tree instanceof JSONPathAndExpression) return "&& AND";
    if (tree instanceof JSONPathOrExpression) return "&& OR";
    if (tree instanceof JSONPathComparisonExpression) return "< Comparison";
    if (tree instanceof JSONPathFunctionExpression) return "f() Function";
    if (tree instanceof JSONPathFilterQueryExpression) return "@ Filter Query";
    return tree.type;
}