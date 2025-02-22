import { Divider, Flex, Group, Select } from "@mantine/core";
import { ReactNode } from "react";

export default function PanelShell({
    toolbar,
    children,
}: {
    toolbar: ReactNode,
    children: ReactNode
}) {
    return (
        <Flex direction="column" h="100%">
            <Flex style={{ minHeight: "50px" }} align="center" p="xs">
                {toolbar}
            </Flex>
            <Divider />
            <div style={{ flex: "1 1 0", minHeight: 0 }}>
                {children}
            </div>
        </Flex>
    );
}